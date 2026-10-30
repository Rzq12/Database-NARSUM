import type { Prisma, Narasumber } from '../generated/prisma/client'
import type { Akun } from './auth'

// FR-21: Admin Unit melihat semua narasumber undangan unitnya, ditambah yang sudah disetujui dari unit lain.
// Keuangan hanya yang disetujui. Inspektorat dan Super Admin melihat semua.
export function whereTerlihat(akun: Akun): Prisma.NarasumberWhereInput {
  switch (akun.role) {
    case 'super_admin':
    case 'inspektorat':
      return {}
    case 'keuangan':
      return { status_review: 'disetujui' }
    case 'admin_unit':
      return { OR: [{ unit_pengundang_id: { in: unitIds(akun) } }, { status_review: 'disetujui' }] }
    default:
      return { id: -1 }
  }
}

export async function cariNarasumberTerlihat(akun: Akun, id: number) {
  const ns = await prisma.narasumber.findFirst({
    where: { AND: [{ id }, whereTerlihat(akun)] },
    include: {
      user: { select: { email: true, tipe: true } },
      unit_pengundang: true,
      dokumen: true,
      reviews: { include: { reviewer: { select: { email: true, nama: true } } }, orderBy: { created_at: 'desc' } },
    },
  })
  if (!ns) throw createError({ statusCode: 404, message: 'Data narasumber tidak ditemukan atau di luar kewenangan Anda.' })
  return ns
}

// Admin Unit hanya mereview narasumber yang diundang unitnya.
export function bolehReview(akun: Akun, ns: Pick<Narasumber, 'unit_pengundang_id'>): boolean {
  if (akun.role === 'super_admin') return true
  return akun.role === 'admin_unit'
    && ns.unit_pengundang_id !== null
    && unitIds(akun).includes(ns.unit_pengundang_id)
}

export function profilDariDb(ns: Narasumber, mode: 'penuh' | 'samar'): Profil {
  const tampil = (enc: string | null) => {
    const nilai = dekripsiAtauNull(enc)
    return mode === 'penuh' ? nilai : samarkan(nilai)
  }
  return {
    nama_lengkap: ns.nama_lengkap,
    nip: ns.nip,
    nik: tampil(ns.nik_enc),
    tempat_lahir: ns.tempat_lahir,
    tanggal_lahir: ns.tanggal_lahir ? ns.tanggal_lahir.toISOString().slice(0, 10) : null,
    pangkat_golongan: ns.pangkat_golongan,
    npwp: tampil(ns.npwp_enc),
    jabatan: ns.jabatan,
    eselon: ns.eselon as Profil['eselon'],
    instansi: ns.instansi,
    alamat_kantor: ns.alamat_kantor,
    no_telp_hp: ns.no_telp_hp,
    agama: ns.agama as Profil['agama'],
    pendidikan_terakhir: ns.pendidikan_terakhir as Profil['pendidikan_terakhir'],
    nama_bank: ns.nama_bank,
    no_rekening: tampil(ns.no_rekening_enc),
    nama_pemilik_rekening: ns.nama_pemilik_rekening,
  }
}

export function profilKeDb(p: Profil, tipe: 'asn' | 'non_asn') {
  const asn = tipe === 'asn'
  return {
    nama_lengkap: p.nama_lengkap,
    nip: asn ? p.nip : null,
    nik_enc: enkripsiAtauNull(p.nik),
    nik_indeks: p.nik ? indeksNik(p.nik) : null,
    tempat_lahir: p.tempat_lahir,
    tanggal_lahir: p.tanggal_lahir ? new Date(`${p.tanggal_lahir}T00:00:00Z`) : null,
    pangkat_golongan: asn ? p.pangkat_golongan : null,
    npwp_enc: enkripsiAtauNull(p.npwp),
    jabatan: p.jabatan,
    eselon: asn ? p.eselon : null,
    instansi: p.instansi,
    alamat_kantor: p.alamat_kantor,
    no_telp_hp: p.no_telp_hp,
    agama: p.agama,
    pendidikan_terakhir: p.pendidikan_terakhir,
    nama_bank: p.nama_bank,
    no_rekening_enc: enkripsiAtauNull(p.no_rekening),
    nama_pemilik_rekening: p.nama_pemilik_rekening,
  }
}

export function ringkasDokumen(dokumen: { jenis: JenisDokumen, nama_asli: string, ukuran: number, uploaded_at: Date }[]) {
  return dokumen.map(d => ({ jenis: d.jenis, nama_asli: d.nama_asli, ukuran: d.ukuran, uploaded_at: d.uploaded_at }))
}
