<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'] })
const route = useRoute()
const id = Number(route.params.id)
const { data, status, error, refresh } = await useFetch(`/api/narasumber/${id}`)
useSesiHabis(error)
useHead(() => ({ title: `${data.value?.profil.nama_lengkap ?? 'Narasumber'} · Database Narasumber Kegiatan LAN` }))

const lembar = computed(() => (data.value ? barisLembar(data.value.profil, data.value.tipe, data.value.email) : []))
const ukuranDokumen = (jenis: JenisDokumen) => data.value?.dokumen.find(d => d.jenis === jenis)?.ukuran ?? 0

// FR-19: data sensitif tersamar sampai staf menekan "Tampilkan". Aksi itu tercatat di server.
const sensitif = ref<{ nik: string | null, npwp: string | null, no_rekening: string | null } | null>(null)
const membuka = ref(false)
const pesanBuka = ref('')
async function bukaSensitif() {
  membuka.value = true
  pesanBuka.value = ''
  try {
    sensitif.value = await $fetch<NonNullable<typeof sensitif.value>>(`/api/narasumber/${id}/buka` as string, { method: 'POST' })
  }
  catch (e) {
    const g = bacaGalat(e)
    if (!(await tanganiSesiHabis(g))) pesanBuka.value = g.pesan
  }
  finally {
    membuka.value = false
  }
}

const review = reactive({ mode: '' as '' | 'perbaikan', catatan: '', sedang: false, pesan: '', galat: '', emailGagal: false })
async function kirimReview(hasil: 'disetujui' | 'perlu_perbaikan') {
  review.pesan = ''
  review.galat = ''
  review.emailGagal = false
  review.sedang = true
  try {
    const { emailTerkirim } = await $fetch<{ emailTerkirim: boolean }>(`/api/narasumber/${id}/review` as string, { method: 'POST', body: { hasil, catatan: review.catatan } })
    review.emailGagal = !emailTerkirim
    Object.assign(review, { mode: '', catatan: '' })
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    review.galat = g.galat.catatan ?? ''
    review.pesan = g.galat.catatan ? '' : g.pesan
  }
  finally {
    review.sedang = false
  }
}

const dialogHapus = useTemplateRef('dialog-hapus')
const hapus = reactive({ sedang: false, pesan: '' })
async function hapusData() {
  hapus.sedang = true
  hapus.pesan = ''
  try {
    await $fetch(`/api/narasumber/${id}`, { method: 'DELETE' })
    await navigateTo('/admin')
  }
  catch (e) {
    hapus.pesan = bacaGalat(e).pesan
  }
  finally {
    hapus.sedang = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <NuxtLink to="/admin" class="tautan text-sm">Kembali ke daftar narasumber</NuxtLink>

    <p v-if="status === 'pending' && !data" class="mt-6 teks-kecil" role="status">Memuat data narasumber…</p>

    <Pesan v-else-if="error && !data" jenis="galat" judul="Data narasumber tidak bisa dibuka" class="mt-6">
      <p>{{ bacaGalat(error).pesan }}</p>
      <button v-if="bacaGalat(error).status !== 404" type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
    </Pesan>

    <template v-else-if="data">
      <div class="mt-4 min-w-0">
        <h1 class="break-words text-3xl">{{ data.profil.nama_lengkap ?? 'Belum mengisi nama' }}</h1>
        <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sekunder">
          <StatusReview :status="data.status_review" />
          <span>{{ data.tipe === 'asn' ? 'ASN' : 'Bukan ASN' }}</span>
          <span class="break-all">{{ data.email }}</span>
          <span v-if="data.unit_pengundang">Diundang oleh {{ data.unit_pengundang }}</span>
          <span>Diperbarui {{ formatWaktu(data.updated_at) }}</span>
        </p>
      </div>

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div class="min-w-0 space-y-6">
          <div v-if="data.boleh.bukaSensitif" class="flex flex-col gap-2 rounded-kartu border border-garis bg-permukaan px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-arang">
              <template v-if="sensitif">NIK, NPWP, dan nomor rekening ditampilkan penuh. Pembukaan ini tercatat di log audit.</template>
              <template v-else>NIK, NPWP, dan nomor rekening disamarkan. Menampilkannya akan tercatat di log audit.</template>
            </p>
            <button v-if="!sensitif" type="button" class="tombol-kedua shrink-0" :disabled="membuka" @click="bukaSensitif">
              {{ membuka ? 'Membuka…' : 'Tampilkan data sensitif' }}
            </button>
          </div>
          <Pesan v-if="pesanBuka" jenis="galat">{{ pesanBuka }}</Pesan>

          <LembarData v-for="b in lembar" :key="b.id" :judul="b.judul" :baris="b.baris">
            <template v-for="k in (['nik', 'npwp', 'no_rekening'] as const)" :key="k" #[`nilai-${k}`]="{ nilai }">
              <span v-if="sensitif && sensitif[k]" class="font-medium">{{ sensitif[k] }}</span>
              <span v-else-if="nilai" class="tracking-wider">{{ nilai }}</span>
              <span v-else class="text-sekunder">Belum diisi</span>
            </template>
          </LembarData>

          <LembarData judul="Dokumen" :baris="barisDokumen(data.dokumen)">
            <template v-for="jenis in JENIS_DOKUMEN" :key="jenis" #[`nilai-${jenis}`]="{ nilai }">
              <template v-if="nilai">
                <a v-if="data.boleh.unduh" :href="`/api/narasumber/${id}/dokumen/${jenis}`" target="_blank" rel="noopener" class="tautan">{{ nilai }}</a>
                <span v-else>{{ nilai }}</span>
                <span class="text-sm text-sekunder"> · {{ formatUkuran(ukuranDokumen(jenis)) }}</span>
              </template>
              <span v-else class="text-sekunder">Belum diunggah</span>
            </template>
            <template v-if="data.boleh.unduh" #kaki>
              <p class="border-t border-garis px-4 py-2 text-sm text-sekunder">Setiap dokumen yang dibuka tercatat di log audit.</p>
            </template>
          </LembarData>

          <section class="kartu overflow-hidden" aria-labelledby="judul-kegiatan">
            <h2 id="judul-kegiatan" class="border-b border-garis bg-permukaan px-4 py-3 text-base">Riwayat kegiatan</h2>
            <ul v-if="data.kegiatan.length">
              <li v-for="k in data.kegiatan" :key="k.id" class="border-b border-garis px-4 py-3 last:border-b-0">
                <p class="break-words font-medium">{{ k.nama_kegiatan }}</p>
                <p class="mt-1 text-sm text-sekunder">
                  {{ formatTanggal(k.tanggal_kegiatan) }} · {{ k.peran === 'lainnya' ? k.peran_lainnya : LABEL_PERAN[k.peran] }}
                </p>
                <p class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span v-for="nama in BERKAS_KEGIATAN" :key="nama" class="min-w-0 break-words">
                    <span class="text-sekunder">{{ LABEL_BERKAS[nama] }}: </span>
                    <a v-if="data.boleh.unduh" :href="`/api/narasumber/${id}/kegiatan/${k.id}/${nama}`" target="_blank" rel="noopener" class="tautan">{{ k[nama].nama_asli }}</a>
                    <span v-else>{{ k[nama].nama_asli }}</span>
                  </span>
                </p>
              </li>
            </ul>
            <p v-else class="px-4 py-3 text-sekunder">Belum ada kegiatan yang dicatat.</p>
          </section>

          <p v-if="data.pernyataan_benar_at" class="teks-kecil">
            Narasumber menyatakan data ini benar pada {{ formatWaktu(data.pernyataan_benar_at) }}.
          </p>
        </div>

        <aside class="space-y-6">
          <section class="kartu p-5" aria-labelledby="judul-review">
            <h2 id="judul-review" class="text-lg">Review</h2>
            <Pesan v-if="review.emailGagal" jenis="galat" class="mt-3">
              Review tersimpan, tetapi email pemberitahuan ke narasumber gagal dikirim. Kabari narasumber secara langsung.
            </Pesan>

            <template v-if="data.boleh.review">
              <p class="mt-2 text-sm text-arang">Periksa data dan dokumen, lalu setujui atau minta perbaikan. Narasumber menerima email hasilnya.</p>
              <Pesan v-if="review.pesan" jenis="galat" class="mt-3">{{ review.pesan }}</Pesan>
              <div v-if="review.mode !== 'perbaikan'" class="mt-4 flex flex-col gap-2">
                <button type="button" class="tombol-utama" :disabled="review.sedang" @click="kirimReview('disetujui')">
                  {{ review.sedang ? 'Menyimpan…' : 'Setujui data' }}
                </button>
                <button type="button" class="tombol-kedua" :disabled="review.sedang" @click="review.mode = 'perbaikan'">Minta perbaikan</button>
              </div>
              <form v-else class="mt-4 space-y-3" @submit.prevent="kirimReview('perlu_perbaikan')">
                <KolomIsian id="catatan" label="Catatan untuk narasumber" wajib :galat="review.galat" petunjuk="Sebutkan kolom atau dokumen yang perlu diperbaiki.">
                  <template #default="{ id: idKolom, invalid, describedby }">
                    <textarea :id="idKolom" v-model="review.catatan" class="isian" rows="4" maxlength="1000" :aria-invalid="invalid" :aria-describedby="describedby" />
                  </template>
                </KolomIsian>
                <div class="flex flex-wrap gap-2">
                  <button type="submit" class="tombol-utama" :disabled="review.sedang">{{ review.sedang ? 'Mengirim…' : 'Kirim permintaan perbaikan' }}</button>
                  <button type="button" class="tombol-hantu" @click="review.mode = ''">Batal</button>
                </div>
              </form>
            </template>
            <p v-else-if="data.status_review === 'draf'" class="mt-2 text-sm text-arang">
              Narasumber belum menyimpan final. Review tersedia setelah data disimpan final.
            </p>
            <p v-else-if="data.boleh.reviewUnit" class="mt-2 text-sm text-arang">
              Tidak ada yang perlu direview. Review berikutnya tersedia saat narasumber memperbarui data.
            </p>
            <p v-else class="mt-2 text-sm text-arang">Review dilakukan oleh Admin Unit pengundang.</p>

            <h3 class="mt-6 border-t border-garis pt-4 text-base">Riwayat review</h3>
            <ol v-if="data.reviews.length" class="mt-2 space-y-3">
              <li v-for="r in data.reviews" :key="r.id" class="text-sm">
                <p><StatusReview :status="r.hasil" /> <span class="text-sekunder">oleh {{ r.reviewer }}, {{ formatWaktu(r.created_at) }}</span></p>
                <p v-if="r.catatan" class="mt-1 whitespace-pre-line text-arang">{{ r.catatan }}</p>
              </li>
            </ol>
            <p v-else class="mt-2 teks-kecil">Belum pernah direview.</p>
          </section>

          <section v-if="data.boleh.hapus" class="rounded-kartu border border-galat p-5" aria-labelledby="judul-hapus">
            <h2 id="judul-hapus" class="text-lg">Hapus data narasumber</h2>
            <p class="mt-2 text-sm text-arang">Hanya atas permintaan resmi. Data, dokumen, dan akun terhapus permanen.</p>
            <button type="button" class="tombol-bahaya mt-4" @click="dialogHapus?.buka()">Hapus permanen</button>
          </section>
        </aside>
      </div>

      <Dialog ref="dialog-hapus" judul="Hapus data ini secara permanen?">
        <p class="text-arang">
          Data {{ data.profil.nama_lengkap ?? data.email }}, ketiga dokumennya, dan akunnya akan dihapus dan tidak bisa dikembalikan.
          Log audit mencatat penghapusan tanpa menyimpan isi data.
        </p>
        <Pesan v-if="hapus.pesan" jenis="galat" class="mt-3">{{ hapus.pesan }}</Pesan>
        <div class="mt-5 flex flex-wrap gap-3">
          <button type="button" class="tombol-bahaya" :disabled="hapus.sedang" @click="hapusData">{{ hapus.sedang ? 'Menghapus…' : 'Ya, hapus permanen' }}</button>
          <button type="button" class="tombol-kedua" @click="dialogHapus?.tutup()">Batal</button>
        </div>
      </Dialog>
    </template>
  </div>
</template>
