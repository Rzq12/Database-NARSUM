// Endpoint /api/_auth/session bawaan nuxt-auth-utils hanya membaca cookie. Hook ini memastikan
// sesi yang sudah dicabut (logout, ganti password, akun nonaktif) juga terbaca kosong di browser.
export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (sesi, event) => {
    if (!sesi.user) return
    const akun = await prisma.user.findUnique({ where: { id: sesi.user.id }, select: { status: true, versi_sesi: true } })
    if (!akun || akun.status !== 'aktif' || akun.versi_sesi !== sesi.versiSesi) {
      await clearUserSession(event)
      for (const kunci of Object.keys(sesi)) delete (sesi as Record<string, unknown>)[kunci]
    }
  })
})
