export default defineEventHandler(async (event) => {
  const akun = await requireLogin(event)
  const { lama, baru } = await bacaBody(event, skemaUbahPassword)
  if (!akun.password_hash || !(await cocokPassword(akun.password_hash, lama))) {
    throw galat422({ lama: 'Password lama salah' })
  }
  await prisma.user.update({ where: { id: akun.id }, data: { password_hash: await buatHashPassword(baru) } })
  await catatAudit(event, { pelaku: akun, aksi: 'ubah_password', objek: 'user', objekId: akun.id })
  return { ok: true }
})
