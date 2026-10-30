// Mengubah password mengakhiri sesi di perangkat lain; sesi yang sedang dipakai diperbarui agar tetap masuk.
export default defineEventHandler(async (event) => {
  const akun = await requireLogin(event)
  batasiPermintaan(event, 'ubah-password', 10, 15 * 60_000)
  const { lama, baru } = await bacaBody(event, skemaUbahPassword)
  if (!akun.password_hash || !(await cocokPassword(akun.password_hash, lama))) {
    throw galat422({ lama: 'Password lama salah' })
  }
  const diperbarui = await prisma.user.update({
    where: { id: akun.id },
    data: { password_hash: await buatHashPassword(baru), versi_sesi: { increment: 1 } },
  })
  await setUserSession(event, { versiSesi: diperbarui.versi_sesi })
  await catatAudit(event, { pelaku: akun, aksi: 'ubah_password', objek: 'user', objekId: akun.id })
  return { ok: true }
})
