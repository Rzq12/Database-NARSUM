import type { H3Event } from 'h3'
import type { User } from '../generated/prisma/client'

// Dipakai pendaftaran lewat undangan dan pendaftaran mandiri.
export async function pastikanBelumTerdaftar(email: string, noHp: string | null | undefined) {
  const terdaftar = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(noHp ? [{ no_hp: noHp }] : [])] },
    select: { email: true },
  })
  if (!terdaftar) return
  const kolom = terdaftar.email === email ? 'email' : 'no_hp'
  throw galat422(
    { [kolom]: `${kolom === 'email' ? 'Email' : 'Nomor HP'} ini sudah terdaftar. Silakan masuk.` },
    'Akun sudah ada. Silakan masuk dengan akun tersebut.',
  )
}

export async function selesaikanPendaftaran(event: H3Event, akun: User, aksi: 'daftar' | 'daftar_mandiri') {
  const emailTerkirim = await kirimVerifikasi(akun.id, akun.email)
  await catatAudit(event, { pelaku: akun, aksi, objek: 'user', objekId: akun.id })
  await setUserSession(event, {
    user: { id: akun.id, role: 'narasumber', nama: akun.email, email: akun.email, tipe: akun.tipe },
    aktifTerakhir: Date.now(),
    versiSesi: akun.versi_sesi,
  })
  return emailTerkirim
}

export async function cariPendaftaranMenunggu(id: number) {
  const ns = await prisma.narasumber.findFirst({
    where: { id, status_pendaftaran: 'menunggu', user: { email_verified_at: { not: null } } },
    include: { user: { select: { email: true } } },
  })
  if (!ns) throw createError({ statusCode: 404, message: 'Pendaftaran tidak ditemukan atau sudah diproses admin lain.' })
  return ns
}

// Pendaftaran mandiri belum punya unit, jadi semua Admin Unit dan Super Admin aktif diberi tahu.
export async function beritahuAdminPendaftaranBaru(email: string) {
  const admin = await prisma.user.findMany({
    where: { role: { in: ['admin_unit', 'super_admin'] }, status: 'aktif' },
    select: { email: true },
  })
  const { subjek, teks } = templatEmail.pendaftaranMasuk(email)
  await Promise.all(admin.map(a => kirimEmailAman(a.email, subjek, teks)))
}
