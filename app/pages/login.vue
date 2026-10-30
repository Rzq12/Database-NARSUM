<script setup lang="ts">
useHead({ title: 'Masuk · Database Narasumber Kegiatan LAN' })
const { loggedIn, user, fetch: muatSesi } = useUserSession()
const route = useRoute()
if (loggedIn.value && user.value) await navigateTo(berandaRole(user.value.role))

const form = reactive({ identitas: '', password: '' })
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const mengirim = ref(false)

async function masuk() {
  galat.value = {}
  pesan.value = ''
  mengirim.value = true
  try {
    const { beranda } = await $fetch('/api/auth/login', { method: 'POST', body: form })
    await muatSesi()
    const ke = typeof route.query.ke === 'string' && route.query.ke.startsWith('/') ? route.query.ke : beranda
    await navigateTo(ke)
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
  <div class="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_26rem] lg:py-16">
    <section class="max-w-xl">
      <h1 class="text-3xl leading-tight sm:text-4xl">Data narasumber kegiatan LAN, diisi sekali oleh pemiliknya</h1>
      <p class="mt-4 text-lg text-arang">
        Narasumber mengisi data diri, NPWP, rekening, dan CV satu kali. Unit kerja di LAN memakai data yang sama
        tanpa meminta ulang lewat chat atau email.
      </p>
      <dl class="mt-8 border-t border-garis">
        <div class="grid gap-1 border-b border-garis py-4 sm:grid-cols-[10rem_1fr]">
          <dt class="font-medium">Narasumber baru</dt>
          <dd class="text-arang">
            Buka link undangan dari admin kegiatan yang mengundang Anda. Belum menerima undangan?
            <NuxtLink to="/daftar" class="tautan">Ajukan pendaftaran narasumber</NuxtLink>; pendaftaran ini perlu disetujui admin.
          </dd>
        </div>
        <div class="grid gap-1 border-b border-garis py-4 sm:grid-cols-[10rem_1fr]">
          <dt class="font-medium">Sudah terdaftar</dt>
          <dd class="text-arang">Masuk dengan email atau nomor HP dan password untuk melihat atau memperbarui data Anda.</dd>
        </div>
        <div class="grid gap-1 border-b border-garis py-4 sm:grid-cols-[10rem_1fr]">
          <dt class="font-medium">Staf LAN</dt>
          <dd class="text-arang">Akun Admin Unit, Keuangan, dan Inspektorat dibuat oleh Super Admin.</dd>
        </div>
      </dl>
    </section>

    <section class="kartu self-start p-6" aria-labelledby="judul-masuk">
      <h2 id="judul-masuk" class="text-xl">Masuk</h2>
      <Pesan v-if="route.query.habis" class="mt-4">Sesi Anda berakhir karena lama tidak aktif. Silakan masuk lagi.</Pesan>
      <Pesan v-if="pesan" jenis="galat" class="mt-4">{{ pesan }}</Pesan>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="masuk">
        <KolomIsian id="identitas" label="Email atau nomor HP" :galat="galat.identitas">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.identitas" class="isian" type="text" autocomplete="username" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <KolomIsian id="password" label="Password" :galat="galat.password">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.password" class="isian" type="password" autocomplete="current-password" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <button type="submit" class="tombol-utama w-full" :disabled="mengirim">
          {{ mengirim ? 'Memeriksa…' : 'Masuk' }}
        </button>
      </form>
      <div class="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-2 text-sm">
        <NuxtLink to="/lupa-password" class="tautan">Lupa password?</NuxtLink>
        <NuxtLink to="/daftar" class="tautan">Ajukan pendaftaran narasumber</NuxtLink>
      </div>
    </section>
  </div>
</template>
