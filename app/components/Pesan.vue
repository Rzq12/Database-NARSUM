<script setup lang="ts">
const props = defineProps<{ jenis?: 'info' | 'galat' | 'sukses', judul?: string }>()
const kelas = computed(() => ({
  info: 'border-garis bg-permukaan',
  galat: 'border-galat bg-galat-latar',
  sukses: 'border-st-setuju-teks/40 bg-st-setuju',
}[props.jenis ?? 'info']))
</script>

<template>
  <div class="rounded-kartu border px-4 py-3" :class="kelas" :role="jenis === 'galat' ? 'alert' : 'status'">
    <p v-if="judul" class="font-semibold" :class="jenis === 'galat' ? 'text-galat' : 'text-tinta'">{{ judul }}</p>
    <div class="text-arang" :class="{ 'mt-1': judul }">
      <slot />
    </div>
  </div>
</template>
