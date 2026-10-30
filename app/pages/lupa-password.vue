<script setup lang="ts">
useHead({ title: 'Lupa password · Database Narasumber Kegiatan LAN' })
const email = ref('')
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const terkirim = ref(false)
const mengirim = ref(false)

async function kirim() {
  galat.value = {}
  pesan.value = ''
  mengirim.value = true
  try {
    await $fetch('/api/auth/lupa-password', { method: 'POST', body: { email: email.value } })
    terkirim.value = true
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
  <div class="mx-auto max-w-md px-4 py-12">
    <h1 class="text-2xl">Lupa password</h1>
    <template v-if="terkirim">
      <Pesan jenis="sukses" class="mt-4">
        Jika <strong>{{ email }}</strong> terdaftar, link untuk membuat password baru sudah dikirim. Link berlaku 1 jam.
      </Pesan>
      <NuxtLink to="/login" class="tombol-kedua mt-6">Kembali ke halaman masuk</NuxtLink>
    </template>
    <form v-else class="mt-4 space-y-4" novalidate @submit.prevent="kirim">
      <p class="text-arang">Masukkan email akun Anda. Kami kirim link untuk membuat password baru.</p>
      <Pesan v-if="pesan && !galat.email" jenis="galat">{{ pesan }}</Pesan>
      <KolomIsian id="email" label="Email" :galat="galat.email">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="email" class="isian" type="email" autocomplete="email" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <div class="flex flex-wrap gap-3">
        <button type="submit" class="tombol-utama" :disabled="mengirim">{{ mengirim ? 'Mengirim…' : 'Kirim link reset' }}</button>
        <NuxtLink to="/login" class="tombol-hantu">Batal</NuxtLink>
      </div>
    </form>
  </div>
</template>
