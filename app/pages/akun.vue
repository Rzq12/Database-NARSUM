<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Akun · Database Narasumber Kegiatan LAN' })
const { user } = useUserSession()
const form = reactive({ lama: '', baru: '', ulangi: '' })
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const berhasil = ref(false)
const mengirim = ref(false)

async function simpan() {
  galat.value = {}
  pesan.value = ''
  berhasil.value = false
  if (form.baru !== form.ulangi) {
    galat.value = { ulangi: 'Password baru tidak sama' }
    return
  }
  mengirim.value = true
  try {
    await $fetch('/api/auth/ubah-password', { method: 'POST', body: { lama: form.lama, baru: form.baru } })
    berhasil.value = true
    Object.assign(form, { lama: '', baru: '', ulangi: '' })
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
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
    <h1 class="text-3xl">Akun</h1>
    <dl class="mt-6 border-t border-garis">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-1 border-b border-garis py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt class="text-arang">Email</dt>
        <dd class="break-words font-medium">{{ user?.email }}</dd>
      </div>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-1 border-b border-garis py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <dt class="text-arang">Role</dt>
        <dd class="font-medium">{{ user ? LABEL_ROLE[user.role] : '' }}</dd>
      </div>
    </dl>

    <section class="mt-10" aria-labelledby="judul-password">
      <h2 id="judul-password" class="text-xl">Ubah password</h2>
      <form class="mt-4 max-w-md space-y-4" novalidate @submit.prevent="simpan">
        <Pesan v-if="berhasil" jenis="sukses">Password berhasil diubah.</Pesan>
        <Pesan v-if="pesan" jenis="galat">{{ pesan }}</Pesan>
        <KolomIsian id="lama" label="Password lama" :galat="galat.lama">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.lama" class="isian" type="password" autocomplete="current-password" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <KolomIsian id="baru" label="Password baru" :galat="galat.baru" petunjuk="Minimal 10 karakter.">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.baru" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <KolomIsian id="ulangi" label="Ulangi password baru" :galat="galat.ulangi">
          <template #default="{ id, invalid, describedby }">
            <input :id="id" v-model="form.ulangi" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
          </template>
        </KolomIsian>
        <button type="submit" class="tombol-utama" :disabled="mengirim">{{ mengirim ? 'Menyimpan…' : 'Simpan password baru' }}</button>
      </form>
    </section>
  </div>
</template>
