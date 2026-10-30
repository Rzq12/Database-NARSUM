// Di produksi, server menolak jalan bila konfigurasi keamanan belum lengkap.
// Tanpa SMTP, link verifikasi dan reset password akan tertulis ke log, jadi itu juga dianggap wajib.
export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  const c = useRuntimeConfig()
  const kurang: string[] = []
  if (!/^[0-9a-f]{64}$/i.test(c.kunciEnkripsi)) kurang.push('NUXT_KUNCI_ENKRIPSI (64 karakter hex)')
  if (!/^[0-9a-f]{64}$/i.test(c.kunciIndeks)) kurang.push('NUXT_KUNCI_INDEKS (64 karakter hex)')
  if ((c.session?.password ?? '').length < 32) kurang.push('NUXT_SESSION_PASSWORD (minimal 32 karakter)')
  if (!c.smtpHost) kurang.push('NUXT_SMTP_HOST')
  if (kurang.length) throw new Error(`Konfigurasi produksi belum lengkap: ${kurang.join(', ')}`)
  if (!c.public.urlAplikasi.startsWith('https://')) {
    console.warn('Peringatan: NUXT_PUBLIC_URL_APLIKASI bukan https. NFR-01 mewajibkan HTTPS di produksi.')
  }
})
