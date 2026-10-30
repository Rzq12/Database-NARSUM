export default defineEventHandler(async (event) => {
  const { token, password } = await bacaBody(event, skemaResetPassword)
  const data = await pakaiTokenAkun(token, 'reset')
  const akun = await prisma.user.update({
    where: { id: data.user_id },
    // Link reset dikirim ke email, jadi membukanya sekaligus membuktikan email itu milik pengguna.
    data: {
      password_hash: await buatHashPassword(password),
      gagal_login: 0,
      terkunci_sampai: null,
      email_verified_at: new Date(),
    },
  })
  await catatAudit(event, { pelaku: akun, aksi: 'reset_password', objek: 'user', objekId: akun.id })
  return { ok: true }
})
