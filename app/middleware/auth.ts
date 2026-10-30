// Hanya untuk pengalaman pengguna. Cek akses yang sebenarnya ada di setiap endpoint server.
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo(`/login?ke=${encodeURIComponent(to.fullPath)}`)
})
