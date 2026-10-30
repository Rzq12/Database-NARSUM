<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { loggedIn, user } = useUserSession()
const tujuan = computed(() => (loggedIn.value && user.value ? berandaRole(user.value.role) : '/login'))
const judul = computed(() => (props.error.statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'))
</script>

<template>
  <NuxtLayout>
    <section class="mx-auto max-w-xl px-4 py-16">
      <p class="teks-kecil">Kode {{ error.statusCode }}</p>
      <h1 class="mt-1 text-3xl">{{ judul }}</h1>
      <p class="mt-3 text-arang">
        {{ error.statusCode === 404 ? 'Alamat yang Anda buka tidak ada di aplikasi ini.' : error.message }}
      </p>
      <button type="button" class="tombol-utama mt-8" @click="clearError({ redirect: tujuan })">
        Kembali ke halaman utama
      </button>
    </section>
  </NuxtLayout>
</template>
