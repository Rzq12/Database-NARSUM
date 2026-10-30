<script setup lang="ts">
const gelap = ref(false)

onMounted(() => {
  const tema = document.documentElement.dataset.theme
  gelap.value = tema ? tema === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
})

function ganti() {
  gelap.value = !gelap.value
  const tema = gelap.value ? 'dark' : 'light'
  document.documentElement.dataset.theme = tema
  try {
    localStorage.setItem('tema', tema)
  }
  catch {
    // Penyimpanan diblokir: tema tetap berganti untuk halaman ini.
  }
}
</script>

<template>
  <button type="button" class="tombol min-h-[44px] border border-navy-redup/60 text-navy-teks hover:bg-white/10" @click="ganti">
    {{ gelap ? 'Ganti ke mode terang' : 'Ganti ke mode gelap' }}
  </button>
</template>
