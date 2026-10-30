// FR-04: lima kali gagal mengunci akun 15 menit (NFR-06).
const BATAS_GAGAL = 5
const KUNCI_MENIT = 15

export default defineEventHandler(async (event) => {
  const { identitas, password } = await bacaBody(event, skemaLogin)
  const hp = identitas.replace(/[\s-]/g, '')
  const akun = await prisma.user.findFirst({
    where: { OR: [{ email: identitas.toLowerCase() }, { no_hp: hp }] },
    include: { narasumber: { select: { nama_lengkap: true } } },
  })
  const salah = createError({ statusCode: 401, message: 'Email/nomor HP atau password salah.' })

  if (!akun || !akun.password_hash) {
    await catatAudit(event, { aksi: 'login_gagal', keterangan: 'akun tidak ditemukan' })
    throw salah
  }
  if (akun.terkunci_sampai && akun.terkunci_sampai > new Date()) {
    const jam = akun.terkunci_sampai.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    throw createError({ statusCode: 423, message: `Akun terkunci sementara karena ${BATAS_GAGAL} kali gagal masuk. Coba lagi setelah pukul ${jam}.` })
  }
  if (akun.status !== 'aktif') {
    throw createError({ statusCode: 403, message: 'Akun ini dinonaktifkan. Hubungi Super Admin.' })
  }

  if (!(await cocokPassword(akun.password_hash, password))) {
    const gagal = akun.gagal_login + 1
    await prisma.user.update({
      where: { id: akun.id },
      data: gagal >= BATAS_GAGAL
        ? { gagal_login: 0, terkunci_sampai: new Date(Date.now() + KUNCI_MENIT * 60_000) }
        : { gagal_login: gagal },
    })
    await catatAudit(event, { pelaku: akun, aksi: 'login_gagal', keterangan: `percobaan ke-${gagal}` })
    throw salah
  }

  await prisma.user.update({ where: { id: akun.id }, data: { gagal_login: 0, terkunci_sampai: null } })
  await setUserSession(event, {
    user: {
      id: akun.id,
      role: akun.role,
      nama: akun.nama ?? akun.narasumber?.nama_lengkap ?? akun.email,
      email: akun.email,
      tipe: akun.tipe,
    },
    aktifTerakhir: Date.now(),
  })
  await catatAudit(event, { pelaku: akun, aksi: 'login' })
  return { beranda: berandaRole(akun.role) }
})
