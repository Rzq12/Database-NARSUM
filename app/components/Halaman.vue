<script setup lang="ts">
// Navigasi halaman untuk daftar panjang.
const props = defineProps<{ halaman: number, total: number, perHalaman: number }>()
const emit = defineEmits<{ pindah: [halaman: number] }>()
const jumlah = computed(() => Math.max(1, Math.ceil(props.total / props.perHalaman)))
</script>

<template>
  <nav v-if="jumlah > 1" aria-label="Halaman" class="flex flex-wrap items-center justify-between gap-3">
    <button type="button" class="tombol-kedua" :disabled="halaman <= 1" @click="emit('pindah', halaman - 1)">Sebelumnya</button>
    <span class="teks-kecil">Halaman {{ halaman }} dari {{ jumlah }}</span>
    <button type="button" class="tombol-kedua" :disabled="halaman >= jumlah" @click="emit('pindah', halaman + 1)">Berikutnya</button>
  </nav>
</template>
