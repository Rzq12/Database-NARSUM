declare module '#app' {
  interface PageMeta {
    roles?: Role[]
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  const roles = to.meta.roles
  if (!user.value) return navigateTo('/login')
  if (roles && !roles.includes(user.value.role)) return navigateTo(berandaRole(user.value.role))
})
