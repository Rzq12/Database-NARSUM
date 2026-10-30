export interface Galat {
  pesan: string
  galat: Record<string, string>
  status?: number
  data?: Record<string, unknown>
}

// Membaca error dari $fetch/useFetch menjadi pesan umum dan pesan per kolom (lihat server/utils/body.ts).
export function bacaGalat(e: unknown): Galat {
  const err = e as { statusCode?: number, status?: number, data?: { message?: string, data?: Record<string, unknown> } } | null
  const status = err?.statusCode ?? err?.status
  if (!err?.data) {
    return { pesan: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', galat: {}, status }
  }
  const data = err.data.data
  return {
    pesan: err.data.message || 'Terjadi kesalahan. Coba lagi.',
    galat: (data?.galat as Record<string, string>) ?? {},
    status,
    data,
  }
}

// Sesi yang berakhir (NFR-07) dikembalikan ke halaman masuk.
export async function tanganiSesiHabis(g: Galat) {
  if (g.status === 401) {
    await useUserSession().fetch()
    await navigateTo('/login?habis=1')
    return true
  }
  return false
}
