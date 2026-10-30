import type { H3Event } from 'h3'
import type { Kegiatan } from '../generated/prisma/client'

export function berkasDariParam(event: H3Event): BerkasKegiatan {
  const berkas = getRouterParam(event, 'berkas') as BerkasKegiatan
  if (!BERKAS_KEGIATAN.includes(berkas)) throw createError({ statusCode: 404, message: 'Berkas tidak dikenal.' })
  return berkas
}

export function ringkasKegiatan(kegiatan: Kegiatan[]) {
  return kegiatan.map(k => ({
    id: k.id,
    nama_kegiatan: k.nama_kegiatan,
    tanggal_kegiatan: k.tanggal_kegiatan.toISOString().slice(0, 10),
    peran: k.peran,
    peran_lainnya: k.peran_lainnya,
    bahan: { nama_asli: k.bahan_nama_asli, ukuran: k.bahan_ukuran },
    surat_tugas: { nama_asli: k.surat_tugas_nama_asli, ukuran: k.surat_tugas_ukuran },
    created_at: k.created_at,
  }))
}

export function kirimBerkasKegiatan(event: H3Event, k: Kegiatan, berkas: BerkasKegiatan) {
  const dok = berkas === 'bahan'
    ? { path: k.bahan_path, nama_asli: k.bahan_nama_asli }
    : { path: k.surat_tugas_path, nama_asli: k.surat_tugas_nama_asli }
  return kirimDokumen(event, { ...dok, mime: 'application/pdf' })
}
