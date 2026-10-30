<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['inspektorat', 'super_admin'] })
useHead({ title: 'Log audit · Database Narasumber Kegiatan LAN' })

const filter = reactive({ dari: '', sampai: '', pelaku: '', aksi: '', halaman: 1 })
const isian = reactive({ dari: '', sampai: '', pelaku: '', aksi: '' })
const { data, status, error, refresh } = await useFetch('/api/audit', { query: filter })
watch(error, async (e) => { if (e) await tanganiSesiHabis(bacaGalat(e)) }, { immediate: true })

function terapkan() {
  Object.assign(filter, isian, { halaman: 1 })
}
function hapusFilter() {
  Object.assign(isian, { dari: '', sampai: '', pelaku: '', aksi: '' })
  terapkan()
}
const adaFilter = computed(() => !!(filter.dari || filter.sampai || filter.pelaku || filter.aksi))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-3xl">Log audit</h1>
    <p class="mt-1 max-w-2xl text-arang">
      Catatan siapa melakukan apa dan kapan. Log hanya bisa dibaca dan tidak memuat nilai NIK, NPWP, rekening, atau password.
    </p>

    <form class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[10rem_10rem_1fr_14rem_auto] lg:items-end" @submit.prevent="terapkan">
      <div>
        <label for="dari" class="label">Dari tanggal</label>
        <input id="dari" v-model="isian.dari" type="date" class="isian">
      </div>
      <div>
        <label for="sampai" class="label">Sampai tanggal</label>
        <input id="sampai" v-model="isian.sampai" type="date" class="isian">
      </div>
      <div>
        <label for="pelaku" class="label">Pelaku (email)</label>
        <input id="pelaku" v-model="isian.pelaku" class="isian">
      </div>
      <div>
        <label for="aksi" class="label">Aksi</label>
        <select id="aksi" v-model="isian.aksi" class="isian">
          <option value="">Semua aksi</option>
          <option v-for="(label, k) in LABEL_AKSI" :key="k" :value="k">{{ label }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button type="submit" class="tombol-kedua">Terapkan</button>
        <button v-if="adaFilter" type="button" class="tombol-hantu" @click="hapusFilter">Hapus filter</button>
      </div>
    </form>

    <div class="mt-6">
      <p v-if="status === 'pending'" class="teks-kecil" role="status">Memuat log…</p>
      <Pesan v-else-if="error" jenis="galat" judul="Log tidak bisa dimuat">
        <p>{{ bacaGalat(error).pesan }}</p>
        <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
      </Pesan>
      <p v-else-if="data && data.total === 0" class="rounded-kartu border border-dashed border-garis-kuat px-5 py-8 text-arang">
        {{ adaFilter ? 'Tidak ada entri log yang cocok dengan filter ini.' : 'Belum ada entri log.' }}
      </p>
      <template v-else-if="data">
        <p class="mb-2 teks-kecil">{{ data.total }} entri</p>
        <ol class="kartu overflow-hidden">
          <li v-for="l in data.items" :key="l.id" class="grid gap-x-4 gap-y-0.5 border-b border-garis px-4 py-3 text-sm last:border-b-0 md:grid-cols-[10rem_1fr_12rem]">
            <span class="text-sekunder">{{ formatWaktu(l.waktu) }}</span>
            <span class="min-w-0">
              <span class="font-medium">{{ LABEL_AKSI[l.aksi] ?? l.aksi }}</span>
              <span v-if="l.objek" class="text-sekunder"> · {{ l.objek }}<template v-if="l.objek_id"> #{{ l.objek_id }}</template></span>
              <span v-if="l.keterangan" class="block break-words text-arang">{{ l.keterangan }}</span>
            </span>
            <span class="min-w-0 break-all text-arang">
              {{ l.pelaku ?? 'Tanpa akun' }}
              <span v-if="l.ip" class="block text-sekunder">IP {{ l.ip }}</span>
            </span>
          </li>
        </ol>
        <Halaman class="mt-4" :halaman="data.halaman" :total="data.total" :per-halaman="data.perHalaman" @pindah="filter.halaman = $event" />
      </template>
    </div>
  </div>
</template>
