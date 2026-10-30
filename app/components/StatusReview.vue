<script setup lang="ts">
// Warna tint pastel dari notion-DESIGN.md hanya dipakai di sini, karena di sini warnanya membawa arti (status).
// Teks status selalu tertulis, jadi tidak bergantung pada warna saja.
const props = defineProps<{ status: StatusReview }>()
const kelas: Record<StatusReview, string> = {
  draf: 'bg-st-draf text-st-draf-teks',
  menunggu_review: 'bg-st-menunggu text-st-menunggu-teks',
  disetujui: 'bg-st-setuju text-st-setuju-teks',
  perlu_perbaikan: 'bg-st-perbaikan text-st-perbaikan-teks',
}
</script>

<template>
  <span class="inline-flex items-center whitespace-nowrap rounded-chip px-2 py-0.5 text-[13px] font-semibold" :class="kelas[props.status]">
    {{ LABEL_STATUS[props.status] }}
  </span>
</template>
