import type { Ref } from 'vue'

// Bila data halaman gagal dimuat karena sesi berakhir (NFR-07), arahkan ke halaman masuk.
export function useSesiHabis(error: Ref<unknown>) {
  watch(error, async (e) => {
    if (e) await tanganiSesiHabis(bacaGalat(e))
  }, { immediate: true })
}
