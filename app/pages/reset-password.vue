<script setup lang="ts">
// Dipakai untuk reset password dan untuk staf baru membuat password pertama.
useHead({ title: 'Buat password · Database Narasumber Kegiatan LAN' })
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const form = reactive({ password: '', ulangi: '' })
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const berhasil = ref(false)
const mengirim = ref(false)

async function simpan() {
  galat.value = {}
  pesan.value = ''
  if (form.password !== form.ulangi) {
    galat.value = { ulangi: 'Password tidak sama' }
    return
  }
  mengirim.value = true
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token, password: form.password } })
    berhasil.value = true
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
    <h1 class="text-2xl">Buat password baru</h1>
    <Pesan v-if="!token" jenis="galat" class="mt-4">
      Link tidak lengkap. Buka link dari email Anda, atau minta link baru di halaman
      <NuxtLink to="/lupa-password" class="tautan">lupa password</NuxtLink>.
    </Pesan>
    <template v-else-if="berhasil">
      <Pesan jenis="sukses" class="mt-4">Password tersimpan. Silakan masuk dengan password baru.</Pesan>
      <NuxtLink to="/login" class="tombol-utama mt-6">Masuk</NuxtLink>
    </template>
    <form v-else class="mt-4 space-y-4" novalidate @submit.prevent="simpan">
      <Pesan v-if="pesan" jenis="galat">
        {{ pesan }}
        <NuxtLink v-if="!Object.keys(galat).length" to="/lupa-password" class="tautan">Minta link baru</NuxtLink>
      </Pesan>
      <KolomIsian id="password" label="Password baru" wajib :galat="galat.password" petunjuk="Minimal 10 karakter.">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.password" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <KolomIsian id="ulangi" label="Ulangi password" wajib :galat="galat.ulangi">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.ulangi" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <button type="submit" class="tombol-utama" :disabled="mengirim">{{ mengirim ? 'Menyimpan…' : 'Simpan password' }}</button>
    </form>
  </div>
</template>
