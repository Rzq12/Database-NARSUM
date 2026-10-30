<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['super_admin'] })
useHead({ title: 'Pengguna dan unit · Database Narasumber Kegiatan LAN' })
const { user } = useUserSession()

const { data: pengguna, status, error, refresh } = await useFetch('/api/pengguna')
const { data: unit, refresh: muatUnit } = await useFetch('/api/unit')
watch(error, async (e) => { if (e) await tanganiSesiHabis(bacaGalat(e)) }, { immediate: true })

const PILIHAN_ROLE = ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'] as const

// Tambah akun staf (FR-25)
const baru = reactive({ nama: '', email: '', role: 'admin_unit' as typeof PILIHAN_ROLE[number], unit_ids: [] as number[] })
const galatBaru = ref<Record<string, string>>({})
const pesanBaru = ref('')
const suksesBaru = ref('')
const membuat = ref(false)
async function tambah() {
  galatBaru.value = {}
  pesanBaru.value = ''
  suksesBaru.value = ''
  membuat.value = true
  try {
    await $fetch('/api/pengguna', { method: 'POST', body: baru })
    suksesBaru.value = `Akun ${baru.email} dibuat. Link untuk membuat password dikirim ke email tersebut.`
    Object.assign(baru, { nama: '', email: '', unit_ids: [] })
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    galatBaru.value = g.galat
    pesanBaru.value = g.pesan
  }
  finally {
    membuat.value = false
  }
}

// Ubah akun
const dialogUbah = ref<{ buka: () => void, tutup: () => void }>()
const ubah = reactive({ id: 0, nama: '', role: 'admin_unit' as typeof PILIHAN_ROLE[number], unit_ids: [] as number[], galat: {} as Record<string, string>, pesan: '', sedang: false })
function bukaUbah(p: NonNullable<typeof pengguna.value>[number]) {
  Object.assign(ubah, { id: p.id, nama: p.nama ?? '', role: p.role, unit_ids: p.units.map(u => u.id), galat: {}, pesan: '' })
  dialogUbah.value?.buka()
}
async function simpanUbah() {
  ubah.sedang = true
  ubah.galat = {}
  ubah.pesan = ''
  try {
    await $fetch(`/api/pengguna/${ubah.id}`, { method: 'PATCH', body: { nama: ubah.nama, role: ubah.role, unit_ids: ubah.unit_ids } })
    dialogUbah.value?.tutup()
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    ubah.galat = g.galat
    ubah.pesan = g.pesan
  }
  finally {
    ubah.sedang = false
  }
}

const pesanStatus = ref('')
async function gantiStatus(p: { id: number, status: string }) {
  pesanStatus.value = ''
  try {
    await $fetch(`/api/pengguna/${p.id}`, { method: 'PATCH', body: { status: p.status === 'aktif' ? 'nonaktif' : 'aktif' } })
    await refresh()
  }
  catch (e) {
    pesanStatus.value = bacaGalat(e).pesan
  }
}

// Unit (FR-26)
const unitBaru = ref('')
const galatUnit = ref('')
const editUnit = reactive({ id: 0, nama: '', galat: '' })
async function tambahUnit() {
  galatUnit.value = ''
  try {
    await $fetch('/api/unit', { method: 'POST', body: { nama: unitBaru.value } })
    unitBaru.value = ''
    await muatUnit()
  }
  catch (e) {
    const g = bacaGalat(e)
    galatUnit.value = g.galat.nama ?? g.pesan
  }
}
async function simpanUnit() {
  editUnit.galat = ''
  try {
    await $fetch(`/api/unit/${editUnit.id}`, { method: 'PATCH', body: { nama: editUnit.nama } })
    editUnit.id = 0
    await Promise.all([muatUnit(), refresh()])
  }
  catch (e) {
    const g = bacaGalat(e)
    editUnit.galat = g.galat.nama ?? g.pesan
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-3xl">Pengguna dan unit</h1>
    <p class="mt-1 text-arang">Akun staf dibuat di sini. Narasumber mendaftar sendiri lewat link undangan.</p>

    <div class="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="judul-staf" class="min-w-0">
        <h2 id="judul-staf" class="text-xl">Akun staf</h2>
        <Pesan v-if="pesanStatus" jenis="galat" class="mt-3">{{ pesanStatus }}</Pesan>
        <p v-if="status === 'pending'" class="mt-4 teks-kecil" role="status">Memuat akun…</p>
        <Pesan v-else-if="error" jenis="galat" class="mt-4">
          {{ bacaGalat(error).pesan }}
          <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
        </Pesan>
        <ul v-else-if="pengguna?.length" class="kartu mt-4 overflow-hidden">
          <li v-for="p in pengguna" :key="p.id" class="flex flex-col gap-3 border-b border-garis px-4 py-3 last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0">
              <p class="break-words font-medium">
                {{ p.nama ?? p.email }}
                <span v-if="p.status === 'nonaktif'" class="ml-1 rounded-chip bg-st-draf px-2 py-0.5 text-[13px] font-semibold text-st-draf-teks">Nonaktif</span>
              </p>
              <p class="break-all text-sm text-sekunder">{{ p.email }}</p>
              <p class="text-sm text-arang">
                {{ LABEL_ROLE[p.role] }}<template v-if="p.units.length"> · {{ p.units.map(u => u.nama).join(', ') }}</template>
                <template v-if="!p.sudah_atur_password"> · belum membuat password</template>
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button type="button" class="tombol-kedua" @click="bukaUbah(p)">Ubah</button>
              <button v-if="p.id !== user?.id" type="button" class="tombol-hantu" @click="gantiStatus(p)">
                {{ p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>
            </div>
          </li>
        </ul>

        <form class="kartu mt-6 space-y-4 p-5" novalidate @submit.prevent="tambah">
          <h3 class="text-lg">Tambah akun staf</h3>
          <Pesan v-if="suksesBaru" jenis="sukses">{{ suksesBaru }}</Pesan>
          <Pesan v-if="pesanBaru" jenis="galat">{{ pesanBaru }}</Pesan>
          <div class="grid gap-4 md:grid-cols-2">
            <KolomIsian id="baru-nama" label="Nama" wajib :galat="galatBaru.nama">
              <template #default="{ id, invalid, describedby }">
                <input :id="id" v-model="baru.nama" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
              </template>
            </KolomIsian>
            <KolomIsian id="baru-email" label="Email" wajib :galat="galatBaru.email">
              <template #default="{ id, invalid, describedby }">
                <input :id="id" v-model="baru.email" class="isian" type="email" :aria-invalid="invalid" :aria-describedby="describedby">
              </template>
            </KolomIsian>
            <KolomIsian id="baru-role" label="Role" wajib :galat="galatBaru.role">
              <template #default="{ id, invalid, describedby }">
                <select :id="id" v-model="baru.role" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
                  <option v-for="r in PILIHAN_ROLE" :key="r" :value="r">{{ LABEL_ROLE[r] }}</option>
                </select>
              </template>
            </KolomIsian>
          </div>
          <fieldset v-if="baru.role === 'admin_unit'">
            <legend class="label">Unit <span class="font-normal text-sekunder">(wajib untuk Admin Unit)</span></legend>
            <p v-if="!unit?.length" class="text-sm text-arang">Belum ada unit. Tambah unit dulu di bagian Unit.</p>
            <div class="grid gap-x-4 sm:grid-cols-2">
              <label v-for="u in unit ?? []" :key="u.id" class="flex min-h-[40px] items-center gap-2 text-sm">
                <input v-model="baru.unit_ids" type="checkbox" :value="u.id" class="h-4 w-4 accent-[var(--utama)]"> {{ u.nama }}
              </label>
            </div>
            <p v-if="galatBaru.unit_ids" class="mt-1 text-sm font-medium text-galat">{{ galatBaru.unit_ids }}</p>
          </fieldset>
          <button type="submit" class="tombol-utama" :disabled="membuat">{{ membuat ? 'Membuat akun…' : 'Buat akun dan kirim link password' }}</button>
        </form>
      </section>

      <section aria-labelledby="judul-unit">
        <h2 id="judul-unit" class="text-xl">Unit</h2>
        <ul v-if="unit?.length" class="kartu mt-4 overflow-hidden">
          <li v-for="u in unit" :key="u.id" class="border-b border-garis px-4 py-2 last:border-b-0">
            <form v-if="editUnit.id === u.id" class="space-y-2 py-1" @submit.prevent="simpanUnit">
              <label :for="`unit-${u.id}`" class="sr-only">Nama unit</label>
              <input :id="`unit-${u.id}`" v-model="editUnit.nama" class="isian" :aria-invalid="!!editUnit.galat">
              <p v-if="editUnit.galat" class="text-sm font-medium text-galat">{{ editUnit.galat }}</p>
              <div class="flex gap-2">
                <button type="submit" class="tombol-kedua">Simpan</button>
                <button type="button" class="tombol-hantu" @click="editUnit.id = 0">Batal</button>
              </div>
            </form>
            <div v-else class="flex items-center justify-between gap-2">
              <span class="min-w-0 break-words">{{ u.nama }}</span>
              <button type="button" class="tombol-hantu shrink-0" @click="Object.assign(editUnit, { id: u.id, nama: u.nama, galat: '' })">Ubah nama</button>
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 rounded-kartu border border-dashed border-garis-kuat px-4 py-6 text-arang">Belum ada unit. Tambah unit pertama di bawah.</p>

        <form class="mt-4 space-y-2" novalidate @submit.prevent="tambahUnit">
          <label for="unit-baru" class="label">Tambah unit</label>
          <input id="unit-baru" v-model="unitBaru" class="isian" :aria-invalid="!!galatUnit" aria-describedby="unit-baru-galat">
          <p v-if="galatUnit" id="unit-baru-galat" class="text-sm font-medium text-galat">{{ galatUnit }}</p>
          <button type="submit" class="tombol-kedua">Tambah unit</button>
        </form>
      </section>
    </div>

    <Dialog ref="dialogUbah" judul="Ubah akun staf">
      <form class="space-y-4" novalidate @submit.prevent="simpanUbah">
        <Pesan v-if="ubah.pesan" jenis="galat">{{ ubah.pesan }}</Pesan>
        <KolomIsian id="ubah-nama" label="Nama" :galat="ubah.galat.nama">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="ubah.nama" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <KolomIsian id="ubah-role" label="Role" :galat="ubah.galat.role">
          <template #default="{ id, invalid, describedby }">
            <select :id="id" v-model="ubah.role" class="isian" :disabled="ubah.id === user?.id" :aria-invalid="invalid" :aria-describedby="describedby">
              <option v-for="r in PILIHAN_ROLE" :key="r" :value="r">{{ LABEL_ROLE[r] }}</option>
            </select>
          </template>
        </KolomIsian>
        <fieldset v-if="ubah.role === 'admin_unit'">
          <legend class="label">Unit</legend>
          <div class="grid gap-x-4 sm:grid-cols-2">
            <label v-for="u in unit ?? []" :key="u.id" class="flex min-h-[40px] items-center gap-2 text-sm">
              <input v-model="ubah.unit_ids" type="checkbox" :value="u.id" class="h-4 w-4 accent-[var(--utama)]"> {{ u.nama }}
            </label>
          </div>
          <p v-if="ubah.galat.unit_ids" class="mt-1 text-sm font-medium text-galat">{{ ubah.galat.unit_ids }}</p>
        </fieldset>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="tombol-utama" :disabled="ubah.sedang">{{ ubah.sedang ? 'Menyimpan…' : 'Simpan perubahan' }}</button>
          <button type="button" class="tombol-kedua" @click="dialogUbah?.tutup()">Batal</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
