// NFR-07: sesi berakhir setelah 30 menit tidak aktif untuk staf, 8 jam untuk narasumber.
// Berlaku untuk API dan halaman, supaya memuat ulang halaman juga dihitung sebagai aktivitas.
const BATAS_STAF = 30 * 60_000
const BATAS_NARASUMBER = 8 * 60 * 60_000
const COOKIE_SESI = 'nuxt-session'

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!
  if (path.startsWith('/_nuxt/') || /\.\w+$/.test(path) || path.startsWith('/api/auth/login')) return
  const sesi = await getUserSession(event)
  if (!sesi.user) return
  const batas = sesi.user.role === 'narasumber' ? BATAS_NARASUMBER : BATAS_STAF
  if (Date.now() - (sesi.aktifTerakhir ?? 0) > batas) {
    await clearUserSession(event)
    // clearUserSession hanya menyuruh browser menghapus cookie; h3 tetap membaca cookie dari permintaan ini.
    // Cookie dibuang dari permintaan, jadi permintaan ini dan salinan cookie lama diproses sebagai tamu.
    const cookie = event.node.req.headers.cookie
    if (cookie) {
      event.node.req.headers.cookie = cookie.split(';').filter(c => !c.trim().startsWith(`${COOKIE_SESI}=`)).join(';')
    }
    return
  }
  await setUserSession(event, { aktifTerakhir: Date.now() })
})
