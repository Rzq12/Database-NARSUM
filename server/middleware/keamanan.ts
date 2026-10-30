import { randomBytes } from 'node:crypto'

const MAKS_JSON = 256 * 1024
const MAKS_UNGGAHAN = 5.5 * 1024 * 1024 // CV maksimal 5 MB ditambah amplop multipart

// Header keamanan, pemeriksaan asal permintaan (CSRF), dan batas ukuran body.
// Berjalan sebelum middleware sesi karena urutan file abjad.
export default defineEventHandler((event) => {
  const nonce = randomBytes(16).toString('base64')
  event.context.nonce = nonce

  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  })
  // Vite dev server memerlukan skrip dan koneksi HMR yang tidak cocok dengan CSP ketat.
  if (!import.meta.dev) {
    setResponseHeader(event, 'Content-Security-Policy', [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      // Vue dan Nuxt menulis atribut style inline; risiko style injection jauh lebih kecil dari script.
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: blob:`,
      `connect-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
    ].join('; '))
  }

  const metode = event.method
  if (!event.path.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(metode)) return

  // CSRF: tolak perubahan data yang datang dari origin lain, termasuk subdomain lain.
  const origin = getRequestHeader(event, 'origin')
  const situs = getRequestHeader(event, 'sec-fetch-site')
  const originAplikasi = new URL(useRuntimeConfig().public.urlAplikasi).origin
  if ((origin && origin !== originAplikasi) || (!origin && situs && situs !== 'same-origin' && situs !== 'none')) {
    throw createError({ statusCode: 403, message: 'Permintaan dari situs lain ditolak.' })
  }

  // Batas ukuran body sebelum body dibaca, supaya unggahan raksasa tidak masuk ke memori.
  const panjang = getRequestHeader(event, 'content-length')
  if (panjang === undefined && getRequestHeader(event, 'transfer-encoding')) {
    throw createError({ statusCode: 411, message: 'Ukuran permintaan harus diketahui.' })
  }
  const multipart = (getRequestHeader(event, 'content-type') ?? '').startsWith('multipart/form-data')
  if (Number(panjang ?? 0) > (multipart ? MAKS_UNGGAHAN : MAKS_JSON)) {
    throw createError({ statusCode: 413, message: multipart ? 'Ukuran file maksimal 5 MB.' : 'Permintaan terlalu besar.' })
  }
})
