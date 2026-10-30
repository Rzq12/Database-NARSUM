<script setup lang="ts">
useHead({ title: 'Verifikasi email · Database Narasumber Kegiatan LAN' })
const route = useRoute()
const { loggedIn, user } = useUserSession()
const token = typeof route.query.token === 'string' ? route.query.token : ''

const keadaan = ref<'menunggu' | 'memverifikasi' | 'berhasil' | 'gagal'>(token ? 'memverifikasi' : 'menunggu')
const pesan = ref('')
const kirim = ref<'diam' | 'mengirim' | 'terkirim'>('diam')
const pesanKirim = ref('')
// Pendaftaran mandiri masih perlu persetujuan admin setelah email terverifikasi.
const menungguPersetujuan = ref(false)
const mandiri = computed(() => !!route.query.mandiri)

onMounted(async () => {
  if (!token) return
  try {
    const hasil = await $fetch<{ menungguPersetujuan: boolean }>('/api/auth/verifikasi' as string, { method: 'POST', body: { token } })
    menungguPersetujuan.value = hasil.menungguPersetujuan
    keadaan.value = 'berhasil'
  }
  catch (e) {
    keadaan.value = 'gagal'
    pesan.value = bacaGalat(e).pesan
  }
})

async function kirimUlang() {
  kirim.value = 'mengirim'
  pesanKirim.value = ''
  try {
    const hasil = await $fetch('/api/auth/kirim-ulang-verifikasi', { method: 'POST' })
    if (hasil.sudahTerverifikasi) keadaan.value = 'berhasil'
    kirim.value = 'terkirim'
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    pesanKirim.value = g.pesan
    kirim.value = 'diam'
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-12">
    <template v-if="keadaan === 'memverifikasi'">
      <h1 class="text-2xl">Memverifikasi email…</h1>
      <p class="mt-3 text-arang" role="status">Tunggu sebentar.</p>
    </template>

    <template v-else-if="keadaan === 'berhasil' && menungguPersetujuan">
      <h1 class="text-2xl">Email terverifikasi</h1>
      <p class="mt-3 text-arang">
        Pendaftaran Anda sekarang menunggu persetujuan admin kegiatan LAN. Anda akan menerima email setelah
        pendaftaran disetujui, lalu bisa mengisi data narasumber.
      </p>
      <NuxtLink :to="loggedIn ? '/narasumber' : '/login?ke=/narasumber'" class="tombol-kedua mt-6">
        {{ loggedIn ? 'Ke halaman data saya' : 'Masuk' }}
      </NuxtLink>
    </template>

    <template v-else-if="keadaan === 'berhasil'">
      <h1 class="text-2xl">Email terverifikasi</h1>
      <p class="mt-3 text-arang">Sekarang Anda bisa mengisi data narasumber dan mengunggah dokumen.</p>
      <NuxtLink :to="loggedIn ? '/narasumber/isi' : '/login?ke=/narasumber/isi'" class="tombol-utama mt-6">
        {{ loggedIn ? 'Isi data narasumber' : 'Masuk untuk mengisi data' }}
      </NuxtLink>
    </template>

    <template v-else-if="keadaan === 'gagal'">
      <h1 class="text-2xl">Verifikasi tidak berhasil</h1>
      <Pesan jenis="galat" class="mt-4">{{ pesan }}</Pesan>
      <p v-if="loggedIn" class="mt-4 text-arang">Kirim link verifikasi baru ke email Anda.</p>
      <p v-else class="mt-4 text-arang">Masuk dulu, lalu minta link verifikasi baru dari halaman data Anda.</p>
      <button v-if="loggedIn" type="button" class="tombol-utama mt-4" :disabled="kirim === 'mengirim'" @click="kirimUlang">
        {{ kirim === 'mengirim' ? 'Mengirim…' : 'Kirim link baru' }}
      </button>
      <NuxtLink v-else to="/login?ke=/narasumber" class="tombol-kedua mt-4">Masuk</NuxtLink>
      <p v-if="kirim === 'terkirim'" class="mt-3 text-arang" role="status">Link baru sudah dikirim. Periksa email Anda.</p>
    </template>

    <template v-else>
      <h1 class="text-2xl">Periksa email Anda</h1>
      <Pesan v-if="route.query.gagal_kirim && kirim !== 'terkirim'" jenis="galat" class="mt-4">
        Akun Anda sudah dibuat, tetapi email verifikasi gagal dikirim. Tekan "Kirim ulang link" di bawah.
      </Pesan>
      <p class="mt-3 text-arang">
        Kami mengirim link verifikasi ke <strong class="font-semibold text-tinta">{{ user?.email ?? 'email Anda' }}</strong>.
        <template v-if="mandiri">Buka link itu, lalu pendaftaran Anda diteruskan ke admin untuk disetujui. Link berlaku 24 jam.</template>
        <template v-else>Buka link itu untuk mulai mengisi data. Link berlaku 24 jam.</template>
      </p>
      <p class="mt-3 text-arang">Tidak menerima email? Periksa folder spam, atau kirim ulang. Kirim ulang dibatasi 3 kali per jam.</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button v-if="loggedIn" type="button" class="tombol-kedua" :disabled="kirim === 'mengirim'" @click="kirimUlang">
          {{ kirim === 'mengirim' ? 'Mengirim…' : 'Kirim ulang link' }}
        </button>
        <NuxtLink v-if="loggedIn" to="/narasumber" class="tombol-hantu">Ke halaman data saya</NuxtLink>
      </div>
      <p v-if="kirim === 'terkirim'" class="mt-3 text-arang" role="status">Link baru sudah dikirim.</p>
      <Pesan v-if="pesanKirim" jenis="galat" class="mt-3">{{ pesanKirim }}</Pesan>
    </template>
  </div>
</template>
