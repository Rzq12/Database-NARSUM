// NFR-07: sesi berakhir setelah 30 menit tidak aktif untuk staf, 8 jam untuk narasumber.
const BATAS_STAF = 30 * 60_000
const BATAS_NARASUMBER = 8 * 60 * 60_000

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/') || event.path.startsWith('/api/auth/login')) return
  const sesi = await getUserSession(event)
  if (!sesi.user) return
  const batas = sesi.user.role === 'narasumber' ? BATAS_NARASUMBER : BATAS_STAF
  if (Date.now() - (sesi.aktifTerakhir ?? 0) > batas) {
    await clearUserSession(event)
    return
  }
  await setUserSession(event, { aktifTerakhir: Date.now() })
})
