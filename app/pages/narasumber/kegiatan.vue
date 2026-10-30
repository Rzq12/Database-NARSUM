<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['narasumber'] })
useHead({ title: 'Riwayat kegiatan · Database Narasumber Kegiatan LAN' })
const { data: saya } = await useFetch('/api/saya')
const { data, status, error, refresh } = await useFetch('/api/saya/kegiatan')
useSesiHabis(error)

const siapIsi = computed(() => !!saya.value?.akun.terverifikasi && saya.value.status_pendaftaran === 'disetujui')

// Sama dengan aturan server di server/utils/file.ts. Server tetap memeriksa isi file.
const MAKS_MB = 10
const PETUNJUK_BERKAS: Record<BerkasKegiatan, string> = {
  bahan: 'Boleh dikosongkan. Paparan, hasil penilaian, catatan masukan, atau bahan lain. PDF, maksimal 10 MB.',
  surat_tugas: 'Surat tugas dari instansi. PDF, maksimal 10 MB.',
}

const formTerbuka = ref(false)
const kosong = () => ({ nama_kegiatan: '', tanggal_kegiatan: '', peran: '', peran_lainnya: '' })
const form = reactive(kosong())
const berkas = reactive<Record<BerkasKegiatan, File | null>>({ bahan: null, surat_tugas: null })
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const menyimpan = ref(false)
const tersimpan = ref(false)

function bukaForm() {
  formTerbuka.value = true
  tersimpan.value = false
}

function pilihBerkas(nama: BerkasKegiatan, e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] ?? null
  const { [nama]: _, ...sisa } = galat.value
  galat.value = sisa
  if (f && f.size > MAKS_MB * 1024 * 1024) {
    galat.value = { ...sisa, [nama]: `Ukuran file maksimal ${MAKS_MB} MB.` }
    input.value = ''
    berkas[nama] = null
    return
  }
  berkas[nama] = f
}

function tutupForm() {
  Object.assign(form, kosong())
  berkas.bahan = null
  berkas.surat_tugas = null
  galat.value = {}
  pesan.value = ''
  formTerbuka.value = false
}

async function simpan() {
  galat.value = {}
  pesan.value = ''
  const body = new FormData()
  for (const [k, v] of Object.entries(form)) body.append(k, v)
  for (const nama of BERKAS_KEGIATAN) {
    const f = berkas[nama]
    if (f) body.append(nama, f)
  }
  menyimpan.value = true
  try {
    await $fetch('/api/saya/kegiatan', { method: 'POST', body })
    tutupForm()
    tersimpan.value = true
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    galat.value = g.galat
    pesan.value = g.pesan
    await nextTick()
    const kunci = Object.keys(g.galat)[0]
    if (kunci) document.getElementById(kunci)?.focus()
  }
  finally {
    menyimpan.value = false
  }
}

const dialogHapus = useTemplateRef('dialog-hapus')
const hapus = reactive({ id: 0, nama: '', sedang: false, pesan: '' })
function mintaHapus(k: { id: number, nama_kegiatan: string }) {
  Object.assign(hapus, { id: k.id, nama: k.nama_kegiatan, pesan: '' })
  dialogHapus.value?.buka()
}
async function hapusKegiatan() {
  hapus.sedang = true
  hapus.pesan = ''
  try {
    await $fetch(`/api/saya/kegiatan/${hapus.id}`, { method: 'DELETE' })
    dialogHapus.value?.tutup()
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (!(await tanganiSesiHabis(g))) hapus.pesan = g.pesan
  }
  finally {
    hapus.sedang = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl">Riwayat kegiatan</h1>
        <p class="mt-2 text-arang">Catat kegiatan yang Anda ikuti beserta bahan dan surat tugasnya.</p>
      </div>
      <button v-if="siapIsi && !formTerbuka" type="button" class="tombol-utama shrink-0" @click="bukaForm">
        Tambah kegiatan
      </button>
    </div>

    <Pesan v-if="saya && !siapIsi" judul="Belum bisa menambah kegiatan" class="mt-6">
      <p>Verifikasi email dan tunggu persetujuan pendaftaran dulu. Keterangannya ada di halaman <NuxtLink to="/narasumber" class="tautan">Data saya</NuxtLink>.</p>
    </Pesan>

    <Pesan v-if="tersimpan" jenis="sukses" class="mt-6">Kegiatan tersimpan.</Pesan>

    <form v-if="formTerbuka" class="kartu mt-6 space-y-5 p-5" novalidate @submit.prevent="simpan">
      <h2 class="text-lg">Tambah kegiatan</h2>
      <Pesan v-if="pesan" jenis="galat">{{ pesan }}</Pesan>

      <KolomIsian id="nama_kegiatan" label="Nama kegiatan" wajib :galat="galat.nama_kegiatan">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.nama_kegiatan" type="text" class="isian" maxlength="500" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>

      <div class="grid gap-5 sm:grid-cols-2">
        <KolomIsian id="tanggal_kegiatan" label="Tanggal kegiatan" wajib :galat="galat.tanggal_kegiatan">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.tanggal_kegiatan" type="date" class="isian" min="2000-01-01" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>

        <KolomIsian id="peran" label="Peran" wajib :galat="galat.peran">
          <template #default="{ id, invalid, describedby }">
            <select :id="id" v-model="form.peran" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
              <option value="">Pilih…</option>
              <option v-for="p in PERAN_KEGIATAN" :key="p" :value="p">{{ LABEL_PERAN[p] }}</option>
            </select>
          </template>
        </KolomIsian>
      </div>

      <KolomIsian v-if="form.peran === 'lainnya'" id="peran_lainnya" label="Peran lainnya" wajib :galat="galat.peran_lainnya" petunjuk="Contoh: Moderator, Fasilitator, Coach.">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.peran_lainnya" type="text" class="isian" maxlength="100" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>

      <KolomIsian v-for="nama in BERKAS_KEGIATAN" :id="nama" :key="nama" :label="`Unggah ${LABEL_BERKAS[nama].toLowerCase()}`" :wajib="nama === 'surat_tugas'" :galat="galat[nama]" :petunjuk="PETUNJUK_BERKAS[nama]">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" type="file" accept=".pdf,application/pdf" class="isian" :aria-invalid="invalid" :aria-describedby="describedby" @change="pilihBerkas(nama, $event)">
        </template>
      </KolomIsian>

      <div class="flex flex-wrap gap-2">
        <button type="submit" class="tombol-utama" :disabled="menyimpan">{{ menyimpan ? 'Menyimpan…' : 'Simpan kegiatan' }}</button>
        <button type="button" class="tombol-hantu" :disabled="menyimpan" @click="tutupForm">Batal</button>
      </div>
    </form>

    <p v-if="status === 'pending' && !data" class="mt-8 teks-kecil" role="status">Memuat riwayat kegiatan…</p>

    <Pesan v-else-if="error && !data" jenis="galat" judul="Riwayat kegiatan tidak bisa dimuat" class="mt-8">
      <p>{{ bacaGalat(error).pesan }}</p>
      <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
    </Pesan>

    <template v-else-if="data">
      <section v-if="!data.length && !formTerbuka" class="mt-8 rounded-kartu border border-dashed border-garis-kuat p-6">
        <h2 class="text-lg">Belum ada kegiatan</h2>
        <p class="mt-2 text-arang">Tambahkan kegiatan yang Anda ikuti sebagai narasumber, penguji, penceramah, atau pembicara.</p>
      </section>

      <ul v-else class="mt-8 space-y-4">
        <li v-for="k in data" :key="k.id" class="kartu p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="break-words text-base">{{ k.nama_kegiatan }}</h2>
              <p class="mt-1 text-sm text-sekunder">
                {{ formatTanggal(k.tanggal_kegiatan) }} · {{ k.peran === 'lainnya' ? k.peran_lainnya : LABEL_PERAN[k.peran] }}
              </p>
            </div>
            <button type="button" class="tombol-hantu shrink-0" @click="mintaHapus(k)">Hapus</button>
          </div>
          <dl class="mt-3 space-y-1 text-sm">
            <div v-for="nama in BERKAS_KEGIATAN" :key="nama" class="flex flex-wrap gap-x-2">
              <dt class="text-sekunder">{{ LABEL_BERKAS[nama] }}:</dt>
              <dd class="min-w-0 break-words">
                <template v-if="k[nama]">
                  <a :href="`/api/saya/kegiatan/${k.id}/${nama}`" target="_blank" rel="noopener" class="tautan">{{ k[nama].nama_asli }}</a>
                  <span class="text-sekunder"> · {{ formatUkuran(k[nama].ukuran) }}</span>
                </template>
                <span v-else class="text-sekunder">Tidak diunggah</span>
              </dd>
            </div>
          </dl>
        </li>
      </ul>
    </template>

    <Dialog ref="dialog-hapus" judul="Hapus kegiatan ini?">
      <p class="text-arang">Kegiatan "{{ hapus.nama }}" beserta berkasnya akan dihapus permanen.</p>
      <Pesan v-if="hapus.pesan" jenis="galat" class="mt-3">{{ hapus.pesan }}</Pesan>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="tombol-bahaya" :disabled="hapus.sedang" @click="hapusKegiatan">{{ hapus.sedang ? 'Menghapus…' : 'Ya, hapus' }}</button>
        <button type="button" class="tombol-kedua" @click="dialogHapus?.tutup()">Batal</button>
      </div>
    </Dialog>
  </div>
</template>
