<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['narasumber'] })
useHead({ title: 'Data saya · Database Narasumber Kegiatan LAN' })
const route = useRoute()
const { data, status, error, refresh } = await useFetch('/api/saya')

useSesiHabis(error)

const kirimUlang = ref<'diam' | 'mengirim' | 'terkirim'>('diam')
const pesanKirim = ref('')
async function kirimVerifikasi() {
  kirimUlang.value = 'mengirim'
  pesanKirim.value = ''
  try {
    await $fetch('/api/auth/kirim-ulang-verifikasi', { method: 'POST' })
    kirimUlang.value = 'terkirim'
  }
  catch (e) {
    pesanKirim.value = bacaGalat(e).pesan
    kirimUlang.value = 'diam'
  }
}

const menungguPersetujuan = computed(() => data.value?.status_pendaftaran === 'menunggu')
const siapIsi = computed(() => !!data.value?.akun.terverifikasi && !menungguPersetujuan.value)
const belumIsi = computed(() => !!data.value && data.value.status_review === 'draf' && !data.value.profil.nama_lengkap)
const lembar = computed(() => (data.value ? barisLembar(data.value.profil, data.value.akun.tipe, data.value.akun.email) : []))
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <p v-if="status === 'pending'" class="teks-kecil" role="status">Memuat data Anda…</p>

    <Pesan v-else-if="error" jenis="galat" judul="Data Anda tidak bisa dimuat">
      <p>{{ bacaGalat(error).pesan }}</p>
      <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
    </Pesan>

    <template v-else-if="data">
      <Pesan v-if="route.query.tersimpan === 'final'" jenis="sukses" class="mb-6">
        Data tersimpan dan dikirim ke admin kegiatan untuk direview.
      </Pesan>
      <Pesan v-else-if="route.query.tersimpan === 'draf'" jenis="sukses" class="mb-6">
        Draf tersimpan. Admin belum bisa mereview sampai Anda menyimpan final.
      </Pesan>

      <Pesan v-if="!data.akun.terverifikasi" jenis="galat" judul="Email belum terverifikasi" class="mb-6">
        <p>Buka link verifikasi yang dikirim ke {{ data.akun.email }} sebelum mengisi data.</p>
        <button type="button" class="tombol-kedua mt-3" :disabled="kirimUlang === 'mengirim'" @click="kirimVerifikasi">
          {{ kirimUlang === 'mengirim' ? 'Mengirim…' : 'Kirim ulang link verifikasi' }}
        </button>
        <p v-if="kirimUlang === 'terkirim'" class="mt-2">Link baru sudah dikirim.</p>
        <p v-if="pesanKirim" class="mt-2 font-medium text-galat">{{ pesanKirim }}</p>
      </Pesan>

      <Pesan v-else-if="menungguPersetujuan" judul="Pendaftaran menunggu persetujuan admin" class="mb-6">
        <p>Admin kegiatan LAN sedang memeriksa pendaftaran Anda. Anda akan menerima email di {{ data.akun.email }} setelah disetujui, lalu bisa mengisi data.</p>
      </Pesan>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <h1 class="break-words text-3xl">{{ data.profil.nama_lengkap ?? 'Data narasumber Anda' }}</h1>
          <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sekunder">
            <span v-if="menungguPersetujuan" class="font-medium text-arang">Menunggu persetujuan pendaftaran</span>
            <StatusReview v-else :status="data.status_review" />
            <span>{{ data.akun.tipe === 'asn' ? 'ASN' : 'Bukan ASN' }}</span>
            <span v-if="data.unit_pengundang">Diundang oleh {{ data.unit_pengundang }}</span>
            <span>Diperbarui {{ formatWaktu(data.updated_at) }}</span>
          </p>
        </div>
        <NuxtLink v-if="siapIsi" to="/narasumber/isi" class="tombol-utama shrink-0">
          {{ data.status_review === 'draf' ? 'Lengkapi data' : 'Perbarui data' }}
        </NuxtLink>
      </div>

      <Pesan v-if="data.catatan_perbaikan" judul="Admin meminta perbaikan" class="mt-6">
        <p class="whitespace-pre-line">{{ data.catatan_perbaikan }}</p>
      </Pesan>

      <section v-if="belumIsi && siapIsi" class="mt-8 rounded-kartu border border-dashed border-garis-kuat p-6">
        <h2 class="text-lg">Anda belum mengisi data</h2>
        <p class="mt-2 text-arang">
          Isi data diri, kepegawaian, kontak, dan rekening, lalu unggah NPWP, foto buku tabungan, dan CV.
          Anda bisa menyimpan sebagai draf dan melanjutkan nanti.
        </p>
      </section>

      <div v-else-if="!belumIsi" class="mt-8 space-y-6">
        <LembarData v-for="b in lembar" :key="b.id" :judul="b.judul" :baris="b.baris" />

        <LembarData judul="Dokumen" :baris="barisDokumen(data.dokumen)">
          <template v-for="jenis in JENIS_DOKUMEN" :key="jenis" #[`nilai-${jenis}`]="{ nilai }">
            <a v-if="nilai" :href="`/api/saya/dokumen/${jenis}`" target="_blank" rel="noopener" class="tautan">{{ nilai }}</a>
            <span v-else class="text-sekunder">Belum diunggah</span>
          </template>
        </LembarData>

        <p v-if="data.pernyataan_benar_at" class="teks-kecil">
          Anda menyatakan data ini benar pada {{ formatWaktu(data.pernyataan_benar_at) }}.
        </p>
      </div>
    </template>
  </div>
</template>
