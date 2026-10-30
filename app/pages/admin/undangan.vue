<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['admin_unit', 'super_admin'] })
useHead({ title: 'Undangan · Database Narasumber Kegiatan LAN' })
const { user } = useUserSession()

const { data: daftar, status, error, refresh } = await useFetch('/api/undangan')
const { data: semuaUnit } = await useFetch('/api/unit')
watch(error, async (e) => { if (e) await tanganiSesiHabis(bacaGalat(e)) }, { immediate: true })

const unitPilihan = computed(() => (semuaUnit.value ?? []).filter(u => user.value?.role === 'super_admin' || u.milik_saya))
const form = reactive({ unit_id: '', email_tujuan: '', masa_hari: 14, kirim_email: true })
watchEffect(() => {
  if (!form.unit_id && unitPilihan.value.length === 1) form.unit_id = String(unitPilihan.value[0]!.id)
})

const galat = ref<Record<string, string>>({})
const pesan = ref('')
const duplikat = ref<number | null>(null)
const hasil = ref<{ link: string, terkirim: boolean } | null>(null)
const membuat = ref(false)
const tersalin = ref(false)

async function buat() {
  galat.value = {}
  pesan.value = ''
  duplikat.value = null
  hasil.value = null
  tersalin.value = false
  membuat.value = true
  try {
    hasil.value = await $fetch<{ link: string, terkirim: boolean }>('/api/undangan' as string, {
      method: 'POST',
      body: { ...form, kirim_email: form.kirim_email && !!form.email_tujuan },
    })
    form.email_tujuan = ''
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    galat.value = g.galat
    pesan.value = g.pesan
    duplikat.value = (g.data?.narasumber_id as number | null) ?? null
  }
  finally {
    membuat.value = false
  }
}

async function salin() {
  if (!hasil.value) return
  try {
    await navigator.clipboard.writeText(hasil.value.link)
    tersalin.value = true
  }
  catch {
    tersalin.value = false
  }
}

const LABEL_STATUS_UNDANGAN = { belum_dipakai: 'Belum dipakai', dipakai: 'Sudah dipakai', kedaluwarsa: 'Kedaluwarsa', dicabut: 'Dicabut' } as const

const dialogCabut = ref<{ buka: () => void, tutup: () => void }>()
const target = ref<{ id: number, email_tujuan: string | null } | null>(null)
const cabut = reactive({ sedang: false, pesan: '' })
function mintaCabut(u: { id: number, email_tujuan: string | null }) {
  target.value = u
  cabut.pesan = ''
  dialogCabut.value?.buka()
}
async function cabutUndangan() {
  if (!target.value) return
  cabut.sedang = true
  try {
    await $fetch(`/api/undangan/${target.value.id}/cabut`, { method: 'POST' })
    dialogCabut.value?.tutup()
    await refresh()
  }
  catch (e) {
    cabut.pesan = bacaGalat(e).pesan
  }
  finally {
    cabut.sedang = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-3xl">Undangan narasumber</h1>
    <p class="mt-1 max-w-2xl text-arang">
      Buat link untuk narasumber baru. Sebelum mengundang, cari dulu di daftar narasumber: data narasumber yang sudah
      disetujui unit lain bisa dipakai tanpa undangan ulang.
    </p>

    <div class="mt-8 grid gap-8 lg:grid-cols-[24rem_1fr]">
      <section class="kartu self-start p-5" aria-labelledby="judul-buat">
        <h2 id="judul-buat" class="text-lg">Buat link undangan</h2>

        <Pesan v-if="!unitPilihan.length" class="mt-4">
          Akun Anda belum ditautkan ke unit. Hubungi Super Admin.
        </Pesan>

        <form v-else class="mt-4 space-y-4" novalidate @submit.prevent="buat">
          <KolomIsian id="unit_id" label="Atas nama unit" wajib :galat="galat.unit_id">
            <template #default="{ id, invalid, describedby }">
              <select :id="id" v-model="form.unit_id" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="">Pilih unit…</option>
                <option v-for="u in unitPilihan" :key="u.id" :value="String(u.id)">{{ u.nama }}</option>
              </select>
            </template>
          </KolomIsian>
          <KolomIsian id="email_tujuan" label="Email narasumber" :galat="galat.email_tujuan" petunjuk="Opsional. Diisi otomatis di formulir pendaftaran.">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model="form.email_tujuan" class="isian" type="email" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>
          <label class="flex min-h-[44px] items-center gap-3" :class="{ 'text-sekunder': !form.email_tujuan }">
            <input v-model="form.kirim_email" type="checkbox" class="h-5 w-5 accent-[var(--utama)]" :disabled="!form.email_tujuan">
            Kirim link ke email ini sekarang
          </label>
          <KolomIsian id="masa_hari" label="Berlaku (hari)" :galat="galat.masa_hari" petunjuk="1 sampai 60 hari. Bawaan 14 hari.">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model.number="form.masa_hari" class="isian w-32" type="number" min="1" max="60" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>

          <Pesan v-if="pesan" jenis="galat">
            {{ pesan }}
            <NuxtLink v-if="duplikat" :to="`/admin/narasumber/${duplikat}`" class="tautan">Buka data narasumber</NuxtLink>
          </Pesan>
          <button type="submit" class="tombol-utama w-full" :disabled="membuat">{{ membuat ? 'Membuat link…' : 'Buat link undangan' }}</button>
        </form>

        <div v-if="hasil" class="mt-5 rounded-kartu border border-garis bg-permukaan p-4" role="status">
          <p class="font-medium">Link undangan dibuat{{ hasil.terkirim ? ' dan dikirim ke email narasumber' : '' }}.</p>
          <p class="mt-1 text-sm text-arang">Link hanya ditampilkan sekali. Salin sekarang jika ingin mengirimnya sendiri.</p>
          <label for="link-baru" class="sr-only">Link undangan</label>
          <input id="link-baru" class="isian mt-3 text-sm" :value="hasil.link" readonly @focus="($event.target as HTMLInputElement).select()">
          <button type="button" class="tombol-kedua mt-2" @click="salin">{{ tersalin ? 'Link tersalin' : 'Salin link' }}</button>
        </div>
      </section>

      <section aria-labelledby="judul-daftar" class="min-w-0">
        <h2 id="judul-daftar" class="text-lg">Undangan yang sudah dibuat</h2>
        <p v-if="status === 'pending'" class="mt-4 teks-kecil" role="status">Memuat undangan…</p>
        <Pesan v-else-if="error" jenis="galat" class="mt-4">
          {{ bacaGalat(error).pesan }}
          <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
        </Pesan>
        <p v-else-if="!daftar?.length" class="mt-4 rounded-kartu border border-dashed border-garis-kuat px-5 py-8 text-arang">
          Belum ada undangan. Buat link pertama dengan formulir di samping.
        </p>
        <ul v-else class="kartu mt-4 overflow-hidden">
          <li v-for="u in daftar" :key="u.id" class="flex flex-col gap-2 border-b border-garis px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="break-all font-medium">{{ u.email_tujuan ?? 'Tanpa email tujuan' }}</p>
              <p class="text-sm text-sekunder">
                {{ u.unit }} · dibuat {{ formatTanggal(u.created_at) }} oleh {{ u.pembuat }}
                <template v-if="u.dikirim_at"> · dikirim lewat email</template>
              </p>
              <p class="text-sm text-sekunder">Berlaku sampai {{ formatWaktu(u.kedaluwarsa_at) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <span class="text-sm font-medium" :class="u.status === 'belum_dipakai' ? 'text-tinta' : 'text-sekunder'">{{ LABEL_STATUS_UNDANGAN[u.status] }}</span>
              <button v-if="u.status === 'belum_dipakai'" type="button" class="tombol-hantu" @click="mintaCabut(u)">Cabut</button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <Dialog ref="dialogCabut" judul="Cabut undangan ini?">
      <p class="text-arang">Link untuk {{ target?.email_tujuan ?? 'undangan tanpa email tujuan' }} tidak akan bisa dipakai lagi.</p>
      <Pesan v-if="cabut.pesan" jenis="galat" class="mt-3">{{ cabut.pesan }}</Pesan>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="tombol-bahaya" :disabled="cabut.sedang" @click="cabutUndangan">{{ cabut.sedang ? 'Mencabut…' : 'Cabut undangan' }}</button>
        <button type="button" class="tombol-kedua" @click="dialogCabut?.tutup()">Batal</button>
      </div>
    </Dialog>
  </div>
</template>
