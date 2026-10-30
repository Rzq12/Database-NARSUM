<script setup lang="ts">
// Formulir akun narasumber yang dipakai pendaftaran lewat undangan dan pendaftaran mandiri.
interface FormAkun {
  tipe: '' | 'asn' | 'non_asn'
  email: string
  no_hp: string
  password: string
  ulangi: string
  setuju: boolean
}

const form = defineModel<FormAkun>({ required: true })
defineProps<{
  galat: Record<string, string>
  pesan: string
  mengirim: boolean
  labelTombol: string
  emailTerkunci?: boolean
}>()
const emit = defineEmits<{ kirim: [] }>()
const config = useRuntimeConfig()

const PILIHAN_TIPE = [
  { v: 'non_asn', t: 'Bukan ASN', k: 'Akademisi, praktisi, swasta, dan lainnya' },
  { v: 'asn', t: 'ASN', k: 'Pegawai negeri sipil dan PPPK' },
] as const
</script>

<template>
  <form class="space-y-8" novalidate @submit.prevent="emit('kirim')">
    <fieldset>
      <legend class="label text-base">Status kepegawaian Anda <span class="font-normal text-sekunder">(wajib)</span></legend>
      <div class="mt-2 grid gap-3 sm:grid-cols-2">
        <label
          v-for="p in PILIHAN_TIPE"
          :key="p.v"
          class="flex min-h-[44px] cursor-pointer gap-3 rounded-kartu border p-4"
          :class="form.tipe === p.v ? 'border-2 border-utama' : 'border-garis-kuat'"
        >
          <input v-model="form.tipe" type="radio" name="tipe" :value="p.v" class="mt-1 h-4 w-4 accent-[var(--utama)]">
          <span>
            <span class="block font-medium">{{ p.t }}</span>
            <span class="teks-kecil">{{ p.k }}</span>
          </span>
        </label>
      </div>
      <p v-if="galat.tipe" class="mt-1 text-sm font-medium text-galat">{{ galat.tipe }}</p>
    </fieldset>

    <section v-if="form.tipe === 'asn'" class="rounded-kartu border border-garis bg-permukaan p-4" aria-labelledby="judul-myasn">
      <h2 id="judul-myasn" class="text-base">Masuk dengan MyASN</h2>
      <p class="mt-1 text-sm text-arang">
        Login MyASN belum tersambung ke aplikasi ini. Tombol di bawah membuka portal MyASN di tab baru.
        Sambil menunggu, daftar dengan email di bawah. Isian NIP, pangkat/golongan, dan eselon akan muncul di formulir data.
      </p>
      <a :href="config.public.myasnUrl" target="_blank" rel="noopener noreferrer" class="tombol-kedua mt-3">Buka portal MyASN</a>
    </section>

    <div v-if="form.tipe" class="space-y-4">
      <Pesan v-if="pesan" jenis="galat">{{ pesan }}</Pesan>
      <KolomIsian
        id="email"
        label="Email"
        wajib
        :galat="galat.email"
        :petunjuk="emailTerkunci ? 'Undangan ini ditujukan ke email tersebut. Link verifikasi dikirim ke sana.' : 'Link verifikasi dikirim ke email ini.'"
      >
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.email" class="isian" type="email" autocomplete="email" :readonly="emailTerkunci" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <KolomIsian id="no_hp" label="Nomor HP" :galat="galat.no_hp" petunjuk="Opsional. Bisa dipakai untuk masuk selain email. Diawali 08 atau +62.">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.no_hp" class="isian" type="tel" inputmode="tel" autocomplete="tel" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <KolomIsian id="password" label="Password" wajib :galat="galat.password" petunjuk="Minimal 10 karakter.">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.password" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>
      <KolomIsian id="ulangi" label="Ulangi password" wajib :galat="galat.ulangi">
        <template #default="{ id, invalid, describedby }">
          <input :id="id" v-model="form.ulangi" class="isian" type="password" autocomplete="new-password" :aria-invalid="invalid" :aria-describedby="describedby">
        </template>
      </KolomIsian>

      <slot name="tambahan" />

      <section class="rounded-kartu border border-garis p-4" aria-labelledby="judul-pdp">
        <h2 id="judul-pdp" class="text-base">Pemberitahuan pemrosesan data pribadi</h2>
        <p class="mt-2 text-sm text-arang">
          Data yang Anda isi, termasuk NIK, NPWP, nomor rekening, dan dokumen, dipakai Lembaga Administrasi Negara
          untuk administrasi kegiatan dan pembayaran honorarium narasumber, sesuai UU No. 27 Tahun 2022.
          NIK, NPWP, dan nomor rekening disimpan terenkripsi. Hanya staf yang berwenang yang dapat membukanya,
          dan setiap pembukaan dicatat. Anda dapat memperbarui data kapan saja dan dapat meminta penghapusan
          data melalui admin kegiatan.
        </p>
        <label class="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3">
          <input v-model="form.setuju" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[var(--utama)]" :aria-invalid="!!galat.setuju">
          <span>Saya sudah membaca pemberitahuan ini dan setuju data saya diproses untuk keperluan tersebut.</span>
        </label>
        <p v-if="galat.setuju" class="mt-1 text-sm font-medium text-galat">{{ galat.setuju }}</p>
      </section>

      <button type="submit" class="tombol-utama w-full sm:w-auto" :disabled="mengirim">
        {{ mengirim ? 'Mengirim…' : labelTombol }}
      </button>
    </div>
  </form>
</template>
