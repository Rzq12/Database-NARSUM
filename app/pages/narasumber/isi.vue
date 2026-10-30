<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['narasumber'] })
useHead({ title: 'Isi data · Database Narasumber Kegiatan LAN' })
const { data, status, error, refresh } = await useFetch('/api/saya')
useSesiHabis(error)

type Isian = 'teks' | 'angka' | 'tanggal' | 'telepon' | 'pilihan' | 'paragraf'
const ISIAN: Record<KolomProfil, { jenis: Isian, opsi?: readonly string[], petunjuk?: string, panjang?: number, autocomplete?: string }> = {
  nama_lengkap: { jenis: 'teks', petunjuk: 'Lengkap dengan gelar, seperti yang akan ditulis di dokumen kegiatan.', autocomplete: 'name' },
  nip: { jenis: 'angka', panjang: 18, petunjuk: '18 digit angka.' },
  nik: { jenis: 'angka', panjang: 16, petunjuk: '16 digit sesuai KTP.' },
  tempat_lahir: { jenis: 'teks' },
  tanggal_lahir: { jenis: 'tanggal', autocomplete: 'bday' },
  pangkat_golongan: { jenis: 'teks', petunjuk: 'Contoh penulisan: Pembina, IV/a.' },
  npwp: { jenis: 'angka', panjang: 20, petunjuk: '15 atau 16 digit. Titik dan tanda hubung boleh diketik.' },
  jabatan: { jenis: 'teks', autocomplete: 'organization-title' },
  eselon: { jenis: 'pilihan', opsi: ESELON },
  instansi: { jenis: 'teks', autocomplete: 'organization' },
  alamat_kantor: { jenis: 'paragraf', petunjuk: 'Maksimal 500 karakter.' },
  no_telp_hp: { jenis: 'telepon', petunjuk: 'Diawali 08 atau +62.', autocomplete: 'tel' },
  agama: { jenis: 'pilihan', opsi: AGAMA },
  pendidikan_terakhir: { jenis: 'pilihan', opsi: PENDIDIKAN },
  nama_bank: { jenis: 'teks' },
  no_rekening: { jenis: 'angka', panjang: 24, petunjuk: 'Hanya angka, 6 sampai 20 digit.' },
  nama_pemilik_rekening: { jenis: 'teks', petunjuk: 'Sesuai nama di buku tabungan.' },
}

const form = reactive(Object.fromEntries(Object.keys(LABEL_KOLOM).map(k => [k, ''])) as Record<KolomProfil, string>)
const terisi = ref(false)
watch(data, (d) => {
  if (!d || terisi.value) return
  for (const k of Object.keys(form) as KolomProfil[]) form[k] = d.profil[k] ?? ''
  terisi.value = true
}, { immediate: true })

const tipe = computed(() => data.value?.akun.tipe ?? 'non_asn')
const draf = computed(() => data.value?.status_review === 'draf')
const pernyataan = ref(false)
const galat = ref<Record<string, string>>({})
const pesan = ref('')
const menyimpan = ref<'draf' | 'final' | null>(null)

// Pesan galat sebuah kolom hilang begitu nilainya diubah.
watch(() => ({ ...form }), (baru, lama) => {
  for (const k of Object.keys(baru) as KolomProfil[]) {
    if (baru[k] !== lama[k] && galat.value[k]) {
      const { [k]: _, ...sisa } = galat.value
      galat.value = sisa
    }
  }
})

const batasLahir = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 17)
  return d.toISOString().slice(0, 10)
})()

// FR-13: tombol simpan final aktif setelah kolom wajib, tiga dokumen, dan pernyataan terpenuhi.
const kurang = computed(() => {
  const nilai = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() ? v : null])) as Partial<Profil>
  const daftar = Object.keys(cekKelengkapan(nilai, tipe.value)).map(k => ({ id: k, label: LABEL_KOLOM[k as KolomProfil] }))
  for (const jenis of JENIS_DOKUMEN) {
    if (!data.value?.dokumen.some(d => d.jenis === jenis)) daftar.push({ id: `dokumen-${jenis}`, label: `File ${LABEL_DOKUMEN[jenis]}` })
  }
  return daftar
})

async function fokusGalatPertama() {
  await nextTick()
  const kunci = Object.keys(galat.value)[0]
  if (!kunci) return
  const id = kunci.startsWith('dokumen.') ? `dokumen-${kunci.slice(8)}` : kunci
  const el = document.getElementById(id)
  el?.scrollIntoView({ block: 'center' })
  el?.focus({ preventScroll: true })
}

async function simpan(final: boolean) {
  galat.value = {}
  pesan.value = ''
  const cek = skemaProfil.safeParse(form)
  if (!cek.success) {
    galat.value = galatPerKolom(cek.error)
    pesan.value = 'Periksa kembali isian yang ditandai.'
    await fokusGalatPertama()
    return
  }
  menyimpan.value = final ? 'final' : 'draf'
  try {
    await $fetch('/api/saya', { method: 'PUT', body: { profil: form, final, pernyataan: pernyataan.value } })
    await useUserSession().fetch()
    await navigateTo(`/narasumber?tersimpan=${final ? 'final' : 'draf'}`)
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    galat.value = g.galat
    pesan.value = g.pesan
    await fokusGalatPertama()
  }
  finally {
    menyimpan.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <p v-if="status === 'pending' && !data" class="teks-kecil" role="status">Memuat formulir…</p>

    <Pesan v-else-if="error && !data" jenis="galat" judul="Formulir tidak bisa dimuat">
      <p>{{ bacaGalat(error).pesan }}</p>
      <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
    </Pesan>

    <template v-else-if="data">
      <NuxtLink to="/narasumber" class="tautan text-sm">Kembali ke data saya</NuxtLink>
      <h1 class="mt-3 text-3xl">{{ draf ? 'Lengkapi data narasumber' : 'Perbarui data narasumber' }}</h1>
      <p class="mt-2 max-w-2xl text-arang">
        <template v-if="draf">Anda bisa menyimpan sebagai draf dan melanjutkan nanti. Admin kegiatan baru bisa mereview setelah Anda menyimpan final.</template>
        <template v-else>Setiap perubahan disimpan dengan pernyataan kebenaran data dan kembali menunggu review admin kegiatan.</template>
      </p>

      <Pesan v-if="!data.akun.terverifikasi" jenis="galat" class="mt-6">
        Verifikasi email Anda dulu sebelum mengisi data. <NuxtLink to="/verifikasi" class="tautan">Kirim ulang link verifikasi</NuxtLink>
      </Pesan>
      <Pesan v-else-if="data.status_pendaftaran === 'menunggu'" class="mt-6">
        Pendaftaran Anda masih menunggu persetujuan admin. Formulir bisa diisi setelah disetujui; Anda akan menerima email.
      </Pesan>
      <Pesan v-if="data.catatan_perbaikan" judul="Catatan perbaikan dari admin" class="mt-6">
        <p class="whitespace-pre-line">{{ data.catatan_perbaikan }}</p>
      </Pesan>

      <div class="mt-8 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-10">
        <nav aria-label="Bagian formulir" class="hidden lg:block">
          <ul class="sticky top-6 space-y-1 border-l border-garis">
            <li v-for="b in BAGIAN" :key="b.id">
              <a :href="`#${b.id}`" class="-ml-px block border-l-2 border-transparent px-3 py-2 text-sm text-arang hover:border-garis-kuat hover:text-tinta">{{ b.judul }}</a>
            </li>
            <li>
              <a href="#dokumen" class="-ml-px block border-l-2 border-transparent px-3 py-2 text-sm text-arang hover:border-garis-kuat hover:text-tinta">Dokumen</a>
            </li>
            <li>
              <a href="#simpan" class="-ml-px block border-l-2 border-transparent px-3 py-2 text-sm text-arang hover:border-garis-kuat hover:text-tinta">Simpan</a>
            </li>
          </ul>
        </nav>

        <form novalidate @submit.prevent="simpan(true)">
          <fieldset :disabled="!data.akun.terverifikasi || data.status_pendaftaran === 'menunggu'" class="min-w-0 space-y-10">
            <section v-for="b in BAGIAN" :id="b.id" :key="b.id" class="scroll-mt-6" :aria-labelledby="`judul-${b.id}`">
              <h2 :id="`judul-${b.id}`" class="border-b border-garis pb-2 text-xl">{{ b.judul }}</h2>
              <p v-if="b.id === 'kepegawaian' && tipe === 'asn'" class="mt-2 teks-kecil">NIP, pangkat/golongan, dan eselon wajib untuk ASN.</p>
              <div class="mt-4 grid gap-5 md:grid-cols-2">
                <KolomIsian
                  v-for="k in kolomTampil(b.kolom, tipe)"
                  :id="k"
                  :key="k"
                  :label="LABEL_KOLOM[k]"
                  :wajib="kolomWajib(tipe).includes(k)"
                  :galat="galat[k]"
                  :petunjuk="ISIAN[k].petunjuk"
                  :class="{ 'md:col-span-2': ISIAN[k].jenis === 'paragraf' || k === 'nama_lengkap' }"
                >
                  <template #default="{ id, invalid, describedby }">
                    <select v-if="ISIAN[k].jenis === 'pilihan'" :id="id" v-model="form[k]" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
                      <option value="">Pilih…</option>
                      <option v-for="o in ISIAN[k].opsi" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <textarea v-else-if="ISIAN[k].jenis === 'paragraf'" :id="id" v-model="form[k]" class="isian" rows="3" maxlength="500" :aria-invalid="invalid" :aria-describedby="describedby" />
                    <input
                      v-else
                      :id="id"
                      v-model="form[k]"
                      class="isian"
                      :type="ISIAN[k].jenis === 'tanggal' ? 'date' : ISIAN[k].jenis === 'telepon' ? 'tel' : 'text'"
                      :inputmode="ISIAN[k].jenis === 'angka' ? 'numeric' : ISIAN[k].jenis === 'telepon' ? 'tel' : undefined"
                      :maxlength="ISIAN[k].panjang ?? 255"
                      :max="ISIAN[k].jenis === 'tanggal' ? batasLahir : undefined"
                      :autocomplete="ISIAN[k].autocomplete ?? 'off'"
                      :aria-invalid="invalid"
                      :aria-describedby="describedby"
                    >
                  </template>
                </KolomIsian>
                <div v-if="b.id === 'kontak'">
                  <label for="email-akun" class="label">Email</label>
                  <input id="email-akun" class="isian" type="email" :value="data.akun.email" readonly aria-describedby="email-akun-petunjuk">
                  <p id="email-akun-petunjuk" class="mt-1 text-sm text-sekunder">Diambil dari akun Anda.</p>
                </div>
              </div>
            </section>

            <section id="dokumen" class="scroll-mt-6" aria-labelledby="judul-dokumen">
              <h2 id="judul-dokumen" class="border-b border-garis pb-2 text-xl">Dokumen</h2>
              <p class="mt-2 teks-kecil">File langsung tersimpan saat diunggah. Tipe file diperiksa dari isinya.</p>
              <div class="mt-2">
                <UnggahDokumen
                  v-for="jenis in JENIS_DOKUMEN"
                  :key="jenis"
                  :jenis="jenis"
                  :ada="data.dokumen.find(d => d.jenis === jenis)"
                  :boleh-hapus="draf"
                  :galat="galat[`dokumen.${jenis}`]"
                  @berubah="refresh()"
                />
              </div>
            </section>

            <section id="simpan" class="scroll-mt-6 rounded-kartu border border-garis bg-permukaan p-5" aria-labelledby="judul-simpan">
              <h2 id="judul-simpan" class="text-xl">Simpan</h2>
              <Pesan v-if="pesan" jenis="galat" class="mt-4">{{ pesan }}</Pesan>

              <div v-if="kurang.length" class="mt-4">
                <p class="font-medium">Belum lengkap untuk disimpan final:</p>
                <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <li v-for="k in kurang" :key="k.id"><a :href="`#${k.id}`" class="tautan">{{ k.label }}</a></li>
                </ul>
              </div>

              <label class="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3">
                <input id="pernyataan" v-model="pernyataan" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[var(--utama)]" :aria-invalid="!!galat.pernyataan">
                <span class="font-medium">Saya menyatakan bahwa data yang saya isi adalah benar.</span>
              </label>
              <p v-if="galat.pernyataan" class="mt-1 text-sm font-medium text-galat">{{ galat.pernyataan }}</p>

              <div class="mt-5 flex flex-wrap gap-3">
                <button type="submit" class="tombol-utama" :disabled="!!menyimpan || kurang.length > 0 || !pernyataan">
                  {{ menyimpan === 'final' ? 'Menyimpan…' : 'Simpan final dan kirim ke admin' }}
                </button>
                <button v-if="draf" type="button" class="tombol-kedua" :disabled="!!menyimpan" @click="simpan(false)">
                  {{ menyimpan === 'draf' ? 'Menyimpan…' : 'Simpan draf' }}
                </button>
              </div>
            </section>
          </fieldset>
        </form>
      </div>
    </template>
  </div>
</template>
