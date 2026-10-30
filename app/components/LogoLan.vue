<script setup lang="ts">
// Logo resmi dibaca dari public/logo-lan.svg atau public/logo-lan.png (disediakan pemilik proyek).
// Bila belum ada, tampil teks "LAN RI" sebagai penanda sementara, bukan logo buatan.
const sumber = ['/logo-lan.svg', '/logo-lan.png']
const indeks = ref(0)
const gambar = ref<HTMLImageElement>()

// Error gambar bisa terjadi sebelum hidrasi, jadi dicek ulang setelah mount.
onMounted(() => {
  if (gambar.value?.complete && gambar.value.naturalWidth === 0) indeks.value++
})
</script>

<template>
  <img
    v-if="indeks < sumber.length"
    ref="gambar"
    :key="indeks"
    :src="sumber[indeks]"
    alt="Logo Lembaga Administrasi Negara"
    class="h-10 w-auto shrink-0"
    @error="indeks++"
  >
  <span
    v-else
    class="inline-flex h-10 shrink-0 items-center rounded-chip border border-navy-redup px-2 text-xs font-semibold text-navy-teks"
    title="Logo LAN belum dipasang: taruh file di public/logo-lan.svg atau public/logo-lan.png"
  >LAN RI</span>
</template>
