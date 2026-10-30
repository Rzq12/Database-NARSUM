<script setup lang="ts">
const props = defineProps<{
  jenis: JenisDokumen
  ada?: { nama_asli: string, ukuran: number, uploaded_at: string | Date } | null
  bolehHapus?: boolean
  galat?: string
}>()
const emit = defineEmits<{ berubah: [] }>()

// Sama dengan aturan server di server/utils/file.ts (FR-15). Server tetap memeriksa isi file.
const ATURAN = {
  npwp: { accept: '.pdf,.jpg,.jpeg,.png', maksMb: 2, teks: 'PDF, JPG, atau PNG, maksimal 2 MB' },
  buku_tabungan: { accept: '.pdf,.jpg,.jpeg,.png', maksMb: 2, teks: 'PDF, JPG, atau PNG, maksimal 2 MB' },
  cv: { accept: '.pdf,.doc,.docx', maksMb: 4, teks: 'PDF, DOC, atau DOCX, maksimal 4 MB' },
}
const aturan = computed(() => ATURAN[props.jenis])
const id = computed(() => `dokumen-${props.jenis}`)
const sedang = ref<'unggah' | 'hapus' | null>(null)
const pesanGalat = ref('')
const input = ref<HTMLInputElement>()

async function unggah(e: Event) {
  const berkas = (e.target as HTMLInputElement).files?.[0]
  if (!berkas) return
  pesanGalat.value = ''
  if (berkas.size > aturan.value.maksMb * 1024 * 1024) {
    pesanGalat.value = `Ukuran file maksimal ${aturan.value.maksMb} MB.`
    return
  }
  const data = new FormData()
  data.append('berkas', berkas)
  sedang.value = 'unggah'
  try {
    await $fetch(`/api/saya/dokumen/${props.jenis}`, { method: 'POST', body: data })
    emit('berubah')
  }
  catch (err) {
    const g = bacaGalat(err)
    if (!(await tanganiSesiHabis(g))) pesanGalat.value = g.pesan
  }
  finally {
    sedang.value = null
    if (input.value) input.value.value = ''
  }
}

async function hapus() {
  sedang.value = 'hapus'
  pesanGalat.value = ''
  try {
    await $fetch(`/api/saya/dokumen/${props.jenis}`, { method: 'DELETE' })
    emit('berubah')
  }
  catch (err) {
    pesanGalat.value = bacaGalat(err).pesan
  }
  finally {
    sedang.value = null
  }
}
</script>

<template>
  <div class="border-b border-garis py-4 last:border-b-0">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <p class="font-medium">
          {{ LABEL_DOKUMEN[jenis] }} <span class="font-normal text-sekunder">(wajib)</span>
        </p>
        <p class="teks-kecil">{{ aturan.teks }}</p>
        <p v-if="ada" class="mt-2 break-words text-sm">
          Terunggah: <a :href="`/api/saya/dokumen/${jenis}`" target="_blank" rel="noopener" class="tautan">{{ ada.nama_asli }}</a>
          <span class="text-sekunder"> · {{ formatUkuran(ada.ukuran) }} · {{ formatWaktu(ada.uploaded_at) }}</span>
        </p>
        <p v-else class="mt-2 text-sm text-sekunder">Belum ada file.</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2">
        <label :for="id" class="tombol-kedua cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-[var(--fokus)]" :class="{ 'pointer-events-none opacity-60': sedang }">
          {{ sedang === 'unggah' ? 'Mengunggah…' : ada ? 'Ganti file' : 'Pilih file' }}
          <input :id="id" ref="input" type="file" class="sr-only" :accept="aturan.accept" :disabled="!!sedang" :aria-label="`${ada ? 'Ganti' : 'Pilih'} file ${LABEL_DOKUMEN[jenis]}`" :aria-describedby="galat || pesanGalat ? `${id}-galat` : undefined" @change="unggah">
        </label>
        <button v-if="ada && bolehHapus" type="button" class="tombol-hantu" :disabled="!!sedang" @click="hapus">
          {{ sedang === 'hapus' ? 'Menghapus…' : 'Hapus' }}
        </button>
      </div>
    </div>
    <p v-if="pesanGalat || galat" :id="`${id}-galat`" class="mt-2 text-sm font-medium text-galat" role="alert">
      {{ pesanGalat || galat }}
    </p>
  </div>
</template>
