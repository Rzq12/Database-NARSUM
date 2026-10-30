import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'

interface Aturan { tipe: Record<string, string>, maksMb: number, keterangan: string }

// FRS FR-15. Tipe dicek dari isi file. DOC lama terbaca sebagai "cfb" (Compound File Binary).
const ATURAN: Record<JenisDokumen, Aturan> = {
  npwp: { tipe: { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' }, maksMb: 2, keterangan: 'PDF, JPG, atau PNG' },
  buku_tabungan: { tipe: { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' }, maksMb: 2, keterangan: 'PDF, JPG, atau PNG' },
  cv: {
    tipe: {
      pdf: 'application/pdf',
      cfb: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    maksMb: 5,
    keterangan: 'PDF, DOC, atau DOCX',
  },
}

// Bahan (paparan, hasil penilaian, catatan masukan) dan surat tugas di riwayat kegiatan.
const ATURAN_KEGIATAN: Aturan = { tipe: { pdf: 'application/pdf' }, maksMb: 10, keterangan: 'PDF' }

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
  const relatif = join(String(narasumberId), `${awalan}-${randomBytes(8).toString('hex')}.${ext}`)
  await mkdir(join(folderDasar(), String(narasumberId)), { recursive: true })
  await writeFile(join(folderDasar(), relatif), isi)
  return { path: relatif, mime, ukuran: isi.length }
}

export function bacaDokumen(relatif: string) {
  return readFile(join(folderDasar(), relatif))
}

export async function hapusFile(relatif: string) {
  await rm(join(folderDasar(), relatif), { force: true })
}

export async function hapusFolderNarasumber(narasumberId: number) {
  await rm(join(folderDasar(), String(narasumberId)), { recursive: true, force: true })
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
