<script setup lang="ts">
// Memakai <dialog> bawaan: fokus terkunci di dalam dan Escape menutup dialog.
defineProps<{ judul: string }>()
const emit = defineEmits<{ tutup: [] }>()
const el = ref<HTMLDialogElement>()

defineExpose({
  buka: () => el.value?.showModal(),
  tutup: () => el.value?.close(),
})
</script>

<template>
  <dialog
    ref="el"
    class="w-[calc(100%-2rem)] max-w-lg rounded-kartu border border-garis bg-kanvas p-0 text-tinta shadow-[0_16px_48px_-8px_rgba(15,15,15,0.16)] backdrop:bg-black/50"
    aria-labelledby="judul-dialog"
    @close="emit('tutup')"
  >
    <div class="p-5">
      <h2 id="judul-dialog" class="text-lg">{{ judul }}</h2>
      <div class="mt-3">
        <slot />
      </div>
    </div>
  </dialog>
</template>
