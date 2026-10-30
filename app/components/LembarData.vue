<script setup lang="ts">
// Motif "lembar data": label, titik dua, dan nilai dengan garis tipis, mengikuti formulir kertas narasumber LAN.
defineProps<{
  judul: string
  baris: { kunci: string, label: string, nilai: string | null | undefined }[]
}>()
</script>

<template>
  <section class="kartu overflow-hidden">
    <h2 class="border-b border-garis bg-permukaan px-4 py-3 text-base">{{ judul }}</h2>
    <dl>
      <div
        v-for="b in baris"
        :key="b.kunci"
        class="grid gap-x-3 border-b border-garis px-4 py-3 last:border-b-0 sm:grid-cols-[14rem_1rem_1fr]"
      >
        <dt class="text-sm text-sekunder sm:text-base sm:text-arang">{{ b.label }}</dt>
        <span class="hidden text-sekunder sm:block" aria-hidden="true">:</span>
        <dd class="min-w-0 break-words">
          <slot :name="`nilai-${b.kunci}`" :nilai="b.nilai">
            <span v-if="b.nilai">{{ b.nilai }}</span>
            <span v-else class="text-sekunder">Belum diisi</span>
          </slot>
        </dd>
      </div>
    </dl>
  </section>
</template>
