// Menaikkan versi sesi membatalkan semua cookie sesi akun ini, termasuk salinan yang mungkin dicuri.
export default defineEventHandler(async (event) => {
  const sesi = await getUserSession(event)
  if (sesi.user) await naikkanVersiSesi(sesi.user.id).catch(() => {})
  await clearUserSession(event)
  return { ok: true }
})
