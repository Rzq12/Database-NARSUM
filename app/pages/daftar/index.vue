<script setup lang="ts">
useHead({ title: 'Ajukan pendaftaran · Database Narasumber Kegiatan LAN' })
const { fetch: muatSesi, loggedIn } = useUserSession()

const form = ref({
  tipe: '' as '' | 'asn' | 'non_asn',
  email: '',
  no_hp: '',
  password: '',
  ulangi: '',
  setuju: false,
})
const keterangan = ref('')
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const mengirim = ref(false)

async function ajukan() {
  galat.value = {}
  pesan.value = ''
  if (form.value.password !== form.value.ulangi) {
    galat.value = { ulangi: 'Password tidak sama' }
    return
  }
  mengirim.value = true
  try {
    const { ulangi: _, ...isian } = form.value
    const { emailTerkirim } = await $fetch<{ emailTerkirim: boolean }>('/api/auth/daftar-mandiri' as string, {
      method: 'POST',
      body: { ...isian, keterangan: keterangan.value },
    })
    await muatSesi()
    await navigateTo(emailTerkirim ? '/verifikasi?baru=1&mandiri=1' : '/verifikasi?baru=1&mandiri=1&gagal_kirim=1')
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
    <h1 class="text-3xl">Ajukan pendaftaran narasumber</h1>
    <p class="mt-2 text-arang">
      Pendaftaran tanpa undangan perlu disetujui admin kegiatan LAN sebelum Anda bisa mengisi data.
      Anda akan menerima email setelah pendaftaran disetujui.
    </p>
    <Pesan class="mt-4">
      Sudah menerima link undangan dari admin kegiatan? Pakai link itu, karena pendaftaran lewat undangan tidak perlu menunggu persetujuan.
    </Pesan>
    <Pesan v-if="loggedIn" class="mt-4">Anda sedang masuk dengan akun lain. Keluar dulu jika ingin mendaftarkan akun baru.</Pesan>

    <FormAkunNarasumber
      v-model="form"
      class="mt-8"
      :galat="galat"
      :pesan="pesan"
      :mengirim="mengirim"
      label-tombol="Ajukan pendaftaran"
      @kirim="ajukan"
    >
      <template #tambahan>
        <KolomIsian
          id="keterangan"
          label="Keterangan untuk admin"
          :galat="galat.keterangan"
          petunjuk="Opsional. Misalnya kegiatan yang akan Anda isi atau siapa yang menghubungi Anda. Membantu admin menyetujui lebih cepat."
        >
          <template #default="{ id, invalid, describedby }">
            <textarea :id="id" v-model="keterangan" class="isian" rows="3" maxlength="500" :aria-invalid="invalid" :aria-describedby="describedby" />
          </template>
        </KolomIsian>
      </template>
    </FormAkunNarasumber>

    <p class="mt-8 text-sm text-arang">
      Sudah punya akun? <NuxtLink to="/login" class="tautan">Masuk</NuxtLink>
    </p>
  </div>
</template>
