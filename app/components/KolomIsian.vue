<script setup lang="ts">
defineProps<{
  id: string
  label: string
  wajib?: boolean
  galat?: string
  petunjuk?: string
}>()
</script>

<template>
  <div>
    <label :for="id" class="label">
      {{ label }}
      <span v-if="wajib" class="font-normal text-sekunder">(wajib)</span>
    </label>
    <slot :id="id" :invalid="!!galat" :describedby="[petunjuk ? `${id}-petunjuk` : '', galat ? `${id}-galat` : ''].filter(Boolean).join(' ') || undefined" />
    <p v-if="petunjuk" :id="`${id}-petunjuk`" class="mt-1 text-sm text-sekunder">{{ petunjuk }}</p>
    <p v-if="galat" :id="`${id}-galat`" class="mt-1 text-sm font-medium text-galat">{{ galat }}</p>
  </div>
</template>
