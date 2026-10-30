export default defineEventHandler(async (event) => {
  batasiPermintaan(event, 'reset-password', 10, 15 * 60_000)
  const { token, password } = await bacaBody(event, skemaResetPassword)
  const data = await pakaiTokenAkun(token, 'reset')
  const akun = await prisma.user.update({
    where: { id: data.user_id },
    // Link reset dikirim ke email, jadi membukanya sekaligus membuktikan email itu milik pengguna.
    // versi_sesi naik: semua sesi lama, termasuk milik orang yang mungkin mencuri akun, berakhir.
    data: {
      password_hash: await buatHashPassword(password),
      gagal_login: 0,
      terkunci_sampai: null,
      email_verified_at: new Date(),
      versi_sesi: { increment: 1 },
    },
  })
  await catatAudit(event, { pelaku: akun, aksi: 'reset_password', objek: 'user', objekId: akun.id })
  return { ok: true }
})
