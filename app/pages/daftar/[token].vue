<script setup lang="ts">
useHead({ title: 'Daftar narasumber · Database Narasumber Kegiatan LAN' })
const route = useRoute()
const token = String(route.params.token)
const { fetch: muatSesi, loggedIn } = useUserSession()

const { data: undangan, status: muat, error, refresh } = await useFetch(`/api/auth/undangan/${token}`)

const form = ref({
  tipe: '' as '' | 'asn' | 'non_asn',
  email: '',
  no_hp: '',
  password: '',
  ulangi: '',
  setuju: false,
})
watchEffect(() => {
  if (undangan.value?.status === 'berlaku' && undangan.value.email_tujuan && !form.value.email) form.value.email = undangan.value.email_tujuan
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
  if (form.value.password !== form.value.ulangi) {
    galat.value = { ulangi: 'Password tidak sama' }
    return
  }
  mengirim.value = true
  try {
    const { ulangi: _, ...isian } = form.value
    const { emailTerkirim } = await $fetch<{ emailTerkirim: boolean }>('/api/auth/daftar' as string, {
      method: 'POST',
      body: { token, ...isian },
    })
    await muatSesi()
    await navigateTo(emailTerkirim ? '/verifikasi?baru=1' : '/verifikasi?baru=1&gagal_kirim=1')
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
      <p class="mt-3 text-arang">
        Minta link baru ke admin kegiatan yang mengundang Anda, atau
        <NuxtLink to="/daftar" class="tautan">ajukan pendaftaran tanpa undangan</NuxtLink>.
      </p>
      <NuxtLink to="/login" class="tombol-kedua mt-6">Ke halaman masuk</NuxtLink>
    </template>

    <template v-else-if="undangan && undangan.status === 'berlaku'">
      <h1 class="text-3xl">Daftar sebagai narasumber</h1>
      <p class="mt-2 text-arang">
        Diundang oleh <strong class="font-semibold text-tinta">{{ undangan.unit }}</strong>.
        Link berlaku sampai {{ formatWaktu(undangan.kedaluwarsa_at) }}.
      </p>
      <Pesan v-if="loggedIn" class="mt-4">Anda sedang masuk dengan akun lain. Keluar dulu jika ingin mendaftarkan akun baru.</Pesan>

      <FormAkunNarasumber
        v-model="form"
        class="mt-8"
        :galat="galat"
        :pesan="pesan"
        :mengirim="mengirim"
        :email-terkunci="!!undangan.email_tujuan"
        label-tombol="Buat akun narasumber"
        @kirim="daftar"
      />
    </template>
  </div>
</template>
