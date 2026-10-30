import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

interface Aturan { tipe: Record<string, string>, maksMb: number, keterangan: string }

// FRS FR-15. Tipe dicek dari isi file. DOC lama terbaca sebagai "cfb" (Compound File Binary).
// Batas per file 4 MB (CV di FR-15: 5 MB) karena fungsi Vercel menolak request di atas 4,5 MB.
const ATURAN: Record<JenisDokumen, Aturan> = {
  npwp: { tipe: { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' }, maksMb: 2, keterangan: 'PDF, JPG, atau PNG' },
  buku_tabungan: { tipe: { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' }, maksMb: 2, keterangan: 'PDF, JPG, atau PNG' },
  cv: {
    tipe: {
      pdf: 'application/pdf',
      cfb: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    maksMb: 4,
    keterangan: 'PDF, DOC, atau DOCX',
  },
}

// Bahan (paparan, hasil penilaian, catatan masukan) dan surat tugas di riwayat kegiatan.
const ATURAN_KEGIATAN: Aturan = { tipe: { pdf: 'application/pdf' }, maksMb: 4, keterangan: 'PDF' }

// Dokumen disimpan di bucket S3 (Supabase Storage) bila NUXT_S3_ENDPOINT diisi, selain itu di folder lokal.
// Kunci objek dan path folder memakai bentuk yang sama: <narasumber_id>/<nama file acak>.
let klienS3: S3Client | undefined
function s3() {
  const c = useRuntimeConfig()
  if (!c.s3Endpoint) return null
  klienS3 ??= new S3Client({
    endpoint: c.s3Endpoint,
    region: c.s3Region,
    forcePathStyle: true,
    credentials: { accessKeyId: c.s3AccessKeyId, secretAccessKey: c.s3SecretAccessKey },
    // Checksum tambahan SDK v3 tidak didukung semua penyedia S3-compatible.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return { klien: klienS3, bucket: c.s3Bucket }
}

function folderDasar() {
  return resolve(useRuntimeConfig().folderDokumen)
}

export function simpanDokumen(narasumberId: number, jenis: JenisDokumen, isi: Buffer) {
  return simpanBerkas(narasumberId, jenis, isi, ATURAN[jenis])
}

export function simpanBerkasKegiatan(narasumberId: number, berkas: BerkasKegiatan, isi: Buffer) {
  return simpanBerkas(narasumberId, `kegiatan-${berkas}`, isi, ATURAN_KEGIATAN)
}

async function simpanBerkas(narasumberId: number, awalan: string, isi: Buffer, aturan: Aturan) {
  if (isi.length > aturan.maksMb * 1024 * 1024) {
    throw createError({ statusCode: 422, message: `Ukuran file maksimal ${aturan.maksMb} MB.` })
  }
  const terdeteksi = await fileTypeFromBuffer(isi)
  const mime = terdeteksi && aturan.tipe[terdeteksi.ext]
  if (!terdeteksi || !mime) {
    throw createError({ statusCode: 422, message: `Format file harus ${aturan.keterangan}.` })
  }
  await pindaiVirus(isi)
  const ext = terdeteksi.ext === 'cfb' ? 'doc' : terdeteksi.ext
  const relatif = `${narasumberId}/${awalan}-${randomBytes(8).toString('hex')}.${ext}`
  const s = s3()
  if (s) {
    await s.klien.send(new PutObjectCommand({ Bucket: s.bucket, Key: relatif, Body: isi, ContentType: mime }))
  }
  else {
    await mkdir(dirname(join(folderDasar(), relatif)), { recursive: true })
    await writeFile(join(folderDasar(), relatif), isi)
  }
  return { path: relatif, mime, ukuran: isi.length }
}

export async function bacaDokumen(relatif: string): Promise<Buffer> {
  const s = s3()
  if (!s) return readFile(join(folderDasar(), relatif))
  const hasil = await s.klien.send(new GetObjectCommand({ Bucket: s.bucket, Key: relatif }))
  return Buffer.from(await hasil.Body!.transformToByteArray())
}

export async function hapusFile(relatif: string) {
  const s = s3()
  if (s) await s.klien.send(new DeleteObjectCommand({ Bucket: s.bucket, Key: relatif }))
  else await rm(join(folderDasar(), relatif), { force: true })
}

export async function hapusFolderNarasumber(narasumberId: number) {
  const s = s3()
  if (!s) {
    await rm(join(folderDasar(), String(narasumberId)), { recursive: true, force: true })
    return
  }
  const daftar = await s.klien.send(new ListObjectsV2Command({ Bucket: s.bucket, Prefix: `${narasumberId}/` }))
  for (const objek of daftar.Contents ?? []) {
    await s.klien.send(new DeleteObjectCommand({ Bucket: s.bucket, Key: objek.Key }))
  }
}

export async function kirimDokumen(event: Parameters<typeof setResponseHeader>[0], dok: { path: string, mime: string, nama_asli: string }) {
  const isi = await bacaDokumen(dok.path)
  setResponseHeader(event, 'Content-Type', dok.mime)
  // PDF dan gambar boleh dibuka di browser. DOC/DOCX selalu diunduh, tidak dibuka otomatis,
  // karena bisa membawa makro.
  const tampil = ['application/pdf', 'image/jpeg', 'image/png'].includes(dok.mime) ? 'inline' : 'attachment'
  setResponseHeader(event, 'Content-Disposition', `${tampil}; filename*=UTF-8''${encodeURIComponent(dok.nama_asli)}`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  return isi
}
