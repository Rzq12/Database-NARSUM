<script setup lang="ts">
useHead({ title: 'Daftar narasumber · Database Narasumber Kegiatan LAN' })
const route = useRoute()
const token = String(route.params.token)
const { fetch: muatSesi, loggedIn } = useUserSession()
const config = useRuntimeConfig()

const { data: undangan, status: muat, error, refresh } = await useFetch(`/api/auth/undangan/${token}`)

const form = reactive({
  tipe: '' as '' | 'asn' | 'non_asn',
  email: '',
  no_hp: '',
  password: '',
  ulangi: '',
  setuju: false,
})
watchEffect(() => {
  if (undangan.value?.status === 'berlaku' && undangan.value.email_tujuan && !form.email) form.email = undangan.value.email_tujuan
})

const galat = ref<Record<string, string>>({})
const pesan = ref('')
const mengirim = ref(false)

const PESAN_STATUS = {
  tidak_ada: 'Link undangan ini tidak dikenal. Periksa kembali link yang Anda terima.',
  dicabut: 'Link undangan ini sudah dicabut oleh admin kegiatan.',
  dipakai: 'Link undangan ini sudah dipakai untuk mendaftar. Jika itu Anda, silakan masuk.',
  kedaluwarsa: 'Masa berlaku link undangan ini sudah habis.',
} as const

async function daftar() {
  galat.value = {}
  pesan.value = ''
  if (form.password !== form.ulangi) {
    galat.value = { ulangi: 'Password tidak sama' }
    return
  }
  mengirim.value = true
  try {
    await $fetch('/api/auth/daftar', {
      method: 'POST',
      body: { token, tipe: form.tipe, email: form.email, no_hp: form.no_hp, password: form.password, setuju: form.setuju },
    })
    await muatSesi()
    await navigateTo('/verifikasi?baru=1')
  }
  catch (e) {
    const g = bacaGalat(e)
    galat.value = g.galat
    pesan.value = g.pesan
  }
  finally {
    mengirim.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <p v-if="muat === 'pending'" class="teks-kecil" role="status">Memeriksa link undangan…</p>

    <Pesan v-else-if="error" jenis="galat" judul="Link undangan tidak bisa diperiksa">
      <p>{{ bacaGalat(error).pesan }}</p>
      <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
    </Pesan>

    <template v-else-if="undangan && undangan.status !== 'berlaku'">
      <h1 class="text-2xl">Link tidak bisa dipakai</h1>
      <p class="mt-3 text-arang">{{ PESAN_STATUS[undangan.status] }}</p>
      <p class="mt-3 text-arang">Minta link baru ke admin kegiatan yang mengundang Anda.</p>
      <NuxtLink to="/login" class="tombol-kedua mt-6">Ke halaman masuk</NuxtLink>
    </template>

    <template v-else-if="undangan && undangan.status === 'berlaku'">
      <h1 class="text-3xl">Daftar sebagai narasumber</h1>
      <p class="mt-2 text-arang">
        Diundang oleh <strong class="font-semibold text-tinta">{{ undangan.unit }}</strong>.
        Link berlaku sampai {{ formatWaktu(undangan.kedaluwarsa_at) }}.
      </p>
      <Pesan v-if="loggedIn" class="mt-4">Anda sedang masuk dengan akun lain. Keluar dulu jika ingin mendaftarkan akun baru.</Pesan>

      <form class="mt-8 space-y-8" novalidate @submit.prevent="daftar">
        <fieldset>
          <legend class="label text-base">Status kepegawaian Anda <span class="font-normal text-sekunder">(wajib)</span></legend>
          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <label
              v-for="p in [{ v: 'non_asn', t: 'Bukan ASN', k: 'Akademisi, praktisi, swasta, dan lainnya' }, { v: 'asn', t: 'ASN', k: 'Pegawai negeri sipil dan PPPK' }]"
              :key="p.v"
              class="flex min-h-[44px] cursor-pointer gap-3 rounded-kartu border p-4"
              :class="form.tipe === p.v ? 'border-2 border-utama' : 'border-garis-kuat'"
            >
              <input v-model="form.tipe" type="radio" name="tipe" :value="p.v" class="mt-1 h-4 w-4 accent-[var(--utama)]">
              <span>
                <span class="block font-medium">{{ p.t }}</span>
                <span class="teks-kecil">{{ p.k }}</span>
              </span>
            </label>
          </div>
          <p v-if="galat.tipe" class="mt-1 text-sm font-medium text-galat">Pilih status kepegawaian</p>
        </fieldset>

        <section v-if="form.tipe === 'asn'" class="rounded-kartu border border-garis bg-permukaan p-4" aria-labelledby="judul-myasn">
          <h2 id="judul-myasn" class="text-base">Masuk dengan MyASN</h2>
          <p class="mt-1 text-sm text-arang">
            Login MyASN belum tersambung ke aplikasi ini. Tombol di bawah membuka portal MyASN di tab baru.
            Sambil menunggu, daftar dengan email di bawah. Isian NIP, pangkat/golongan, dan eselon akan muncul di formulir data.
          </p>
          <a :href="config.public.myasnUrl" target="_blank" rel="noopener noreferrer" class="tombol-kedua mt-3">Buka portal MyASN</a>
        </section>

        <div v-if="form.tipe" class="space-y-4">
          <Pesan v-if="pesan" jenis="galat">{{ pesan }}</Pesan>
          <KolomIsian id="email" label="Email" wajib :galat="galat.email" petunjuk="Link verifikasi dikirim ke email ini.">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model="form.email" class="isian" type="email" autocomplete="email" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>
          <KolomIsian id="no_hp" label="Nomor HP" :galat="galat.no_hp" petunjuk="Opsional. Bisa dipakai untuk masuk selain email. Diawali 08 atau +62.">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model="form.no_hp" class="isian" type="tel" inputmode="tel" autocomplete="tel" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>
          <KolomIsian id="password" label="Password" wajib :galat="galat.password" petunjuk="Minimal 10 karakter.">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model="form.password" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>
          <KolomIsian id="ulangi" label="Ulangi password" wajib :galat="galat.ulangi">
            <template #default="{ id, invalid, describedby }">
              <input :id="id" v-model="form.ulangi" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
            </template>
          </KolomIsian>

          <section class="rounded-kartu border border-garis p-4" aria-labelledby="judul-pdp">
            <h2 id="judul-pdp" class="text-base">Pemberitahuan pemrosesan data pribadi</h2>
            <p class="mt-2 text-sm text-arang">
              Data yang Anda isi, termasuk NIK, NPWP, nomor rekening, dan dokumen, dipakai Lembaga Administrasi Negara
              untuk administrasi kegiatan dan pembayaran honorarium narasumber, sesuai UU No. 27 Tahun 2022.
              NIK, NPWP, dan nomor rekening disimpan terenkripsi. Hanya staf yang berwenang yang dapat membukanya,
              dan setiap pembukaan dicatat. Anda dapat memperbarui data kapan saja dan dapat meminta penghapusan
              data melalui admin kegiatan.
            </p>
            <label class="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3">
              <input v-model="form.setuju" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[var(--utama)]" :aria-invalid="!!galat.setuju">
              <span>Saya sudah membaca pemberitahuan ini dan setuju data saya diproses untuk keperluan tersebut.</span>
            </label>
            <p v-if="galat.setuju" class="mt-1 text-sm font-medium text-galat">{{ galat.setuju }}</p>
          </section>

          <button type="submit" class="tombol-utama w-full sm:w-auto" :disabled="mengirim">
            {{ mengirim ? 'Membuat akun…' : 'Buat akun narasumber' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
