<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'] })
useHead({ title: 'Narasumber · Database Narasumber Kegiatan LAN' })

const { user } = useUserSession()
const route = useRoute()
const router = useRouter()
const role = computed(() => user.value!.role)
const bisaReview = computed(() => boleh(role.value, 'review'))
const bisaEkspor = computed(() => boleh(role.value, 'ekspor'))
const hanyaDisetujui = computed(() => role.value === 'keuangan')

const q = (k: string) => (typeof route.query[k] === 'string' ? route.query[k] as string : '')
// Admin Unit dan Super Admin membuka antrean review lebih dulu, karena itu pekerjaan utama mereka di sini.
const filter = reactive({
  q: q('q'),
  status: route.query.status !== undefined ? q('status') : bisaReview.value ? 'menunggu_review' : '',
  pendidikan: q('pendidikan'),
  unit: q('unit'),
  instansi: q('instansi'),
  urut: q('urut') || 'baru',
  halaman: Number(route.query.halaman) || 1,
})
const kataCari = ref(filter.q)
const instansiCari = ref(filter.instansi)

watch(filter, () => {
  router.replace({ query: Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== '' && v !== 1).map(([k, v]) => [k, String(v)])) })
})

const { data, status, error, refresh } = await useFetch('/api/narasumber', { query: filter })
const { data: unit } = await useFetch('/api/unit')
useSesiHabis(error)

function cari() {
  filter.q = kataCari.value.trim()
  filter.instansi = instansiCari.value.trim()
  filter.halaman = 1
}
function pilihStatus(s: string) {
  filter.status = s
  filter.halaman = 1
}
function hapusFilter() {
  kataCari.value = ''
  instansiCari.value = ''
  Object.assign(filter, { q: '', status: '', pendidikan: '', unit: '', instansi: '', halaman: 1 })
}
const adaFilter = computed(() => !!(filter.q || filter.status || filter.pendidikan || filter.unit || filter.instansi))

const TAB = [
  { s: 'menunggu_review', t: 'Menunggu review' },
  { s: 'perlu_perbaikan', t: 'Perlu perbaikan' },
  { s: 'disetujui', t: 'Disetujui' },
  { s: 'draf', t: 'Draf' },
  { s: '', t: 'Semua' },
]

const keterangan = computed(() => ({
  admin_unit: 'Narasumber undangan unit Anda, ditambah narasumber yang sudah disetujui unit lain.',
  keuangan: 'Narasumber yang datanya sudah disetujui.',
  inspektorat: 'Semua narasumber. Halaman ini hanya baca.',
  super_admin: 'Semua narasumber di semua unit.',
  narasumber: '',
}[role.value]))

// Pilihan untuk ekspor (FR-24).
const dipilih = ref<number[]>([])
const semuaDipilih = computed(() => !!data.value?.items.length && data.value.items.every(i => dipilih.value.includes(i.id)))
function pilihSemua(e: Event) {
  const ids = data.value?.items.map(i => i.id) ?? []
  dipilih.value = (e.target as HTMLInputElement).checked
    ? [...new Set([...dipilih.value, ...ids])]
    : dipilih.value.filter(id => !ids.includes(id))
}

const dialogEkspor = useTemplateRef('dialog-ekspor')
const KOLOM_EKSPOR = [
  ...(Object.keys(LABEL_KOLOM) as KolomProfil[]).map(k => ({ k: k as string, label: LABEL_KOLOM[k], sensitif: KOLOM_SENSITIF.includes(k) })),
  { k: 'email', label: 'Email', sensitif: false },
  { k: 'status_review', label: 'Status review', sensitif: false },
  { k: 'unit_pengundang', label: 'Unit pengundang', sensitif: false },
]
const ekspor = reactive({
  format: 'xlsx' as 'xlsx' | 'csv',
  kolom: ['nama_lengkap', 'nip', 'jabatan', 'instansi', 'no_telp_hp', 'email', 'status_review'],
  sedang: false,
  pesan: '',
})
async function unduhEkspor() {
  ekspor.sedang = true
  ekspor.pesan = ''
  try {
    const blob = await $fetch<Blob>('/api/narasumber/ekspor', {
      method: 'POST',
      body: { ids: dipilih.value, kolom: ekspor.kolom, format: ekspor.format },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `narasumber-${new Date().toISOString().slice(0, 10)}.${ekspor.format}`
    a.click()
    URL.revokeObjectURL(url)
    dialogEkspor.value?.tutup()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    ekspor.pesan = Object.values(g.galat)[0] ?? g.pesan
  }
  finally {
    ekspor.sedang = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl">Narasumber</h1>
        <p class="mt-1 text-arang">{{ keterangan }}</p>
      </div>
      <NuxtLink v-if="boleh(role, 'buat_undangan')" to="/admin/undangan" class="tombol-utama shrink-0">Buat link undangan</NuxtLink>
    </div>

    <div v-if="!hanyaDisetujui" class="mt-8 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-garis" role="group" aria-label="Status review">
      <button
        v-for="t in TAB"
        :key="t.s"
        type="button"
        class="-mb-px min-h-[44px] shrink-0 border-b-2 px-3 text-sm font-medium"
        :class="filter.status === t.s ? 'border-tinta text-tinta' : 'border-transparent text-sekunder hover:text-tinta'"
        :aria-pressed="filter.status === t.s"
        @click="pilihStatus(t.s)"
      >
        {{ t.t }}
      </button>
    </div>

    <form class="mt-5 space-y-3" role="search" @submit.prevent="cari">
      <div class="flex gap-2">
        <label for="cari" class="sr-only">Cari nama, NIP, instansi, jabatan, atau email</label>
        <input id="cari" v-model="kataCari" type="search" class="isian bg-permukaan" placeholder="Cari nama, NIP, instansi, jabatan, atau email">
        <button type="submit" class="tombol-kedua shrink-0">Cari</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label for="f-pendidikan" class="sr-only">Pendidikan</label>
        <select id="f-pendidikan" v-model="filter.pendidikan" class="isian" @change="filter.halaman = 1">
          <option value="">Semua pendidikan</option>
          <option v-for="p in PENDIDIKAN" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div>
        <label for="f-unit" class="sr-only">Unit pengundang</label>
        <select id="f-unit" v-model="filter.unit" class="isian" @change="filter.halaman = 1">
          <option value="">Semua unit pengundang</option>
          <option v-for="u in unit ?? []" :key="u.id" :value="String(u.id)">{{ u.nama }}</option>
        </select>
      </div>
      <div>
        <label for="f-instansi" class="sr-only">Instansi</label>
        <input id="f-instansi" v-model="instansiCari" class="isian" placeholder="Instansi (tekan Enter)">
      </div>
      <div>
        <label for="f-urut" class="sr-only">Urutan</label>
        <select id="f-urut" v-model="filter.urut" class="isian">
          <option value="baru">Terbaru diperbarui</option>
          <option value="lama">Terlama diperbarui</option>
        </select>
      </div>
      </div>
    </form>

    <div v-if="bisaEkspor && dipilih.length" class="mt-4 flex flex-wrap items-center gap-3 rounded-kartu border border-garis bg-permukaan px-4 py-2">
      <span class="text-sm font-medium">{{ dipilih.length }} narasumber dipilih</span>
      <button type="button" class="tombol-kedua" @click="dialogEkspor?.buka()">Ekspor data terpilih</button>
      <button type="button" class="tombol-hantu" @click="dipilih = []">Batalkan pilihan</button>
    </div>

    <div class="mt-4">
      <p v-if="status === 'pending'" class="py-10 teks-kecil" role="status">Memuat daftar narasumber…</p>

      <Pesan v-else-if="error" jenis="galat" judul="Daftar narasumber tidak bisa dimuat">
        <p>{{ bacaGalat(error).pesan }}</p>
        <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
      </Pesan>

      <div v-else-if="data && data.total === 0" class="rounded-kartu border border-dashed border-garis-kuat px-6 py-10">
        <template v-if="filter.status === 'menunggu_review' && !filter.q && !filter.pendidikan && !filter.unit && !filter.instansi">
          <p class="font-medium">Tidak ada data yang menunggu review.</p>
          <p class="mt-1 text-arang">Data muncul di sini setelah narasumber menyimpan final. Lihat tab lain untuk data yang sudah direview.</p>
        </template>
        <template v-else-if="adaFilter">
          <p class="font-medium">Tidak ada narasumber yang cocok dengan pencarian atau filter ini.</p>
          <button type="button" class="tombol-kedua mt-4" @click="hapusFilter">Hapus semua filter</button>
        </template>
        <template v-else>
          <p class="font-medium">Belum ada narasumber.</p>
          <p class="mt-1 text-arang">
            <template v-if="boleh(role, 'buat_undangan')">Buat link undangan dan kirimkan ke narasumber baru.</template>
            <template v-else>Data muncul setelah narasumber mengisi dan admin unit menyetujuinya.</template>
          </p>
          <NuxtLink v-if="boleh(role, 'buat_undangan')" to="/admin/undangan" class="tombol-utama mt-4">Buat link undangan</NuxtLink>
        </template>
      </div>

      <template v-else-if="data">
        <p class="mb-2 teks-kecil">{{ data.total }} narasumber</p>
        <div class="kartu overflow-hidden">
          <div class="hidden grid-cols-[2.5rem_1.4fr_9.5rem_1.4fr_10rem_9rem] gap-3 border-b border-garis bg-permukaan px-4 py-2 text-sm font-medium text-arang md:grid">
            <span>
              <label v-if="bisaEkspor" class="-m-3 inline-flex cursor-pointer p-3">
                <input type="checkbox" class="h-5 w-5 accent-[var(--utama)]" :checked="semuaDipilih" aria-label="Pilih semua di halaman ini" @change="pilihSemua">
              </label>
            </span>
            <span>Nama</span>
            <span>Status</span>
            <span>Instansi dan jabatan</span>
            <span>Unit pengundang</span>
            <span>Diperbarui</span>
          </div>
          <ul>
            <li
              v-for="n in data.items"
              :key="n.id"
              class="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-1 border-b border-garis px-4 py-3 last:border-b-0 md:grid-cols-[2.5rem_1.4fr_9.5rem_1.4fr_10rem_9rem] md:items-center"
            >
              <span class="row-span-4 md:row-span-1">
                <label v-if="bisaEkspor" class="-m-3 inline-flex cursor-pointer p-3">
                  <input v-model="dipilih" type="checkbox" :value="n.id" class="h-5 w-5 accent-[var(--utama)]" :aria-label="`Pilih ${n.nama_lengkap ?? n.email}`">
                </label>
              </span>
              <span class="min-w-0">
                <NuxtLink :to="`/admin/narasumber/${n.id}`" class="tautan break-words">{{ n.nama_lengkap ?? 'Belum mengisi nama' }}</NuxtLink>
                <span class="block truncate text-sm text-sekunder">{{ n.email }}</span>
              </span>
              <span><StatusReview :status="n.status_review" /></span>
              <span class="min-w-0 text-sm">
                <span class="block break-words">{{ n.instansi ?? '' }}</span>
                <span class="block break-words text-sekunder">{{ n.jabatan ?? '' }}</span>
              </span>
              <span class="text-sm text-arang"><span class="md:hidden">Diundang: </span>{{ n.unit_pengundang ?? '' }}</span>
              <span class="text-sm text-sekunder">{{ formatTanggal(n.updated_at) }}</span>
            </li>
          </ul>
        </div>
        <Halaman class="mt-4" :halaman="data.halaman" :total="data.total" :per-halaman="data.perHalaman" @pindah="filter.halaman = $event" />
      </template>
    </div>

    <Dialog ref="dialog-ekspor" judul="Ekspor data narasumber">
      <form class="space-y-4" @submit.prevent="unduhEkspor">
        <p class="text-sm text-arang">{{ dipilih.length }} narasumber terpilih. Setiap ekspor dicatat di log audit beserta jumlah baris.</p>
        <fieldset>
          <legend class="label">Format</legend>
          <div class="flex gap-4">
            <label class="flex min-h-[44px] items-center gap-2"><input v-model="ekspor.format" type="radio" value="xlsx" class="h-4 w-4 accent-[var(--utama)]"> Excel (XLSX)</label>
            <label class="flex min-h-[44px] items-center gap-2"><input v-model="ekspor.format" type="radio" value="csv" class="h-4 w-4 accent-[var(--utama)]"> CSV</label>
          </div>
        </fieldset>
        <fieldset>
          <legend class="label">Kolom</legend>
          <div class="grid max-h-64 gap-x-4 overflow-y-auto sm:grid-cols-2">
            <label v-for="k in KOLOM_EKSPOR" :key="k.k" class="flex min-h-[40px] items-center gap-2 text-sm">
              <input v-model="ekspor.kolom" type="checkbox" :value="k.k" class="h-4 w-4 shrink-0 accent-[var(--utama)]">
              <span>{{ k.label }}<span v-if="k.sensitif" class="text-sekunder"> (sensitif)</span></span>
            </label>
          </div>
        </fieldset>
        <Pesan v-if="ekspor.pesan" jenis="galat">{{ ekspor.pesan }}</Pesan>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="tombol-utama" :disabled="ekspor.sedang || !ekspor.kolom.length">{{ ekspor.sedang ? 'Menyiapkan file…' : 'Unduh file' }}</button>
          <button type="button" class="tombol-hantu" @click="dialogEkspor?.tutup()">Batal</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
