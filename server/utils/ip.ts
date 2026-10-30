import type { H3Event } from 'h3'

// X-Forwarded-For hanya dipercaya bila aplikasi berada di belakang reverse proxy milik sendiri
// (NUXT_PERCAYA_PROXY=true). Tanpa itu header ini bisa diisi bebas oleh klien.
export function ipKlien(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: useRuntimeConfig().percayaProxy === true }) ?? 'tidak-diketahui'
}
