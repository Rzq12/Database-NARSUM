<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], roles: ['admin_unit', 'super_admin'] })
useHead({ title: 'Pendaftaran · Database Narasumber Kegiatan LAN' })
const { user } = useUserSession()

const { data: daftar, status, error, refresh } = await useFetch('/api/pendaftaran')
const { data: semuaUnit } = await useFetch('/api/unit')
useSesiHabis(error)

// Unit yang dipilih saat menyetujui menjadi unit pengundang narasumber tersebut.
const unitPilihan = computed(() => (semuaUnit.value ?? []).filter(u => user.value?.role === 'super_admin' || u.milik_saya))

type Pendaftar = NonNullable<typeof daftar.value>[number]
const dialog = useTemplateRef('dialog-proses')
const proses = reactive({
  mode: '' as '' | 'setujui' | 'tolak',
  target: null as Pendaftar | null,
  unit_id: '',
  alasan: '',
  sedang: false,
  galat: {} as Record<string, string>,
  pesan: '',
})
const hasil = ref<{ jenis: 'sukses' | 'galat', teks: string } | null>(null)

function buka(mode: 'setujui' | 'tolak', target: Pendaftar) {
  Object.assign(proses, {
    mode,
    target,
    unit_id: unitPilihan.value.length === 1 ? String(unitPilihan.value[0]!.id) : '',
    alasan: '',
    galat: {},
    pesan: '',
  })
  dialog.value?.buka()
}

async function kirim() {
  if (!proses.target) return
  proses.sedang = true
  proses.galat = {}
  proses.pesan = ''
  const setujui = proses.mode === 'setujui'
  try {
    const { emailTerkirim } = await $fetch<{ emailTerkirim: boolean }>(`/api/pendaftaran/${proses.target.id}/${proses.mode}` as string, {
      method: 'POST',
      body: setujui ? { unit_id: proses.unit_id } : { alasan: proses.alasan },
    })
    const email = proses.target.email
    hasil.value = {
      jenis: emailTerkirim ? 'sukses' : 'galat',
      teks: `${email} ${setujui ? 'disetujui' : 'ditolak dan akunnya dihapus'}.`
        + (emailTerkirim ? ' Pendaftar sudah diberi tahu lewat email.' : ' Email pemberitahuan gagal dikirim; kabari pendaftar secara langsung.'),
    }
    dialog.value?.tutup()
    await refresh()
  }
  catch (e) {
    const g = bacaGalat(e)
    if (await tanganiSesiHabis(g)) return
    proses.galat = g.galat
    proses.pesan = Object.keys(g.galat).length ? '' : g.pesan
  }
  finally {
    proses.sedang = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <h1 class="text-3xl">Pendaftaran narasumber</h1>
    <p class="mt-1 max-w-2xl text-arang">
      Narasumber yang mendaftar tanpa undangan dan sudah memverifikasi emailnya. Setelah disetujui, unit yang Anda
      pilih menjadi unit pengundang yang mereview data narasumber tersebut.
    </p>

    <Pesan v-if="hasil" :jenis="hasil.jenis" class="mt-6">{{ hasil.teks }}</Pesan>

    <div class="mt-6">
      <p v-if="status === 'pending'" class="teks-kecil" role="status">Memuat pendaftaran…</p>
      <Pesan v-else-if="error" jenis="galat" judul="Daftar pendaftaran tidak bisa dimuat">
        <p>{{ bacaGalat(error).pesan }}</p>
        <button type="button" class="tombol-kedua mt-3" @click="refresh()">Coba lagi</button>
      </Pesan>
      <div v-else-if="!daftar?.length" class="rounded-kartu border border-dashed border-garis-kuat px-6 py-10">
        <p class="font-medium">Tidak ada pendaftaran yang menunggu persetujuan.</p>
        <p class="mt-1 text-arang">Pendaftaran muncul di sini setelah pendaftar memverifikasi emailnya. Anda juga menerima email pemberitahuan.</p>
      </div>
      <ul v-else class="kartu overflow-hidden">
        <li v-for="p in daftar" :key="p.id" class="flex flex-col gap-3 border-b border-garis px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <p class="break-all font-medium">{{ p.email }}</p>
            <p class="text-sm text-sekunder">
              {{ p.tipe === 'asn' ? 'ASN' : 'Bukan ASN' }}<template v-if="p.no_hp"> · {{ p.no_hp }}</template> · mendaftar {{ formatWaktu(p.didaftarkan_at) }}
            </p>
            <p v-if="p.keterangan" class="mt-2 whitespace-pre-line text-sm text-arang">{{ p.keterangan }}</p>
            <p v-else class="mt-2 text-sm text-sekunder">Tanpa keterangan.</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" class="tombol-utama" @click="buka('setujui', p)">Setujui</button>
            <button type="button" class="tombol-kedua" @click="buka('tolak', p)">Tolak</button>
          </div>
        </li>
      </ul>
    </div>

    <Dialog ref="dialog-proses" :judul="proses.mode === 'setujui' ? 'Setujui pendaftaran' : 'Tolak pendaftaran'">
      <form class="space-y-4" novalidate @submit.prevent="kirim">
        <p class="break-all text-arang">{{ proses.target?.email }}</p>
        <Pesan v-if="proses.pesan" jenis="galat">{{ proses.pesan }}</Pesan>

        <template v-if="proses.mode === 'setujui'">
          <Pesan v-if="!unitPilihan.length">Akun Anda belum ditautkan ke unit. Hubungi Super Admin.</Pesan>
          <KolomIsian v-else id="unit_id" label="Unit pengundang" wajib :galat="proses.galat.unit_id" petunjuk="Unit ini yang nanti mereview data narasumber.">
            <template #default="{ id, invalid, describedby }">
              <select :id="id" v-model="proses.unit_id" class="isian" :aria-invalid="invalid" :aria-describedby="describedby">
                <option value="">Pilih unit…</option>
                <option v-for="u in unitPilihan" :key="u.id" :value="String(u.id)">{{ u.nama }}</option>
              </select>
            </template>
          </KolomIsian>
        </template>

        <template v-else>
          <p class="text-sm text-arang">Akun pendaftar akan dihapus dan alasan ini dikirim ke emailnya.</p>
          <KolomIsian id="alasan" label="Alasan penolakan" wajib :galat="proses.galat.alasan">
            <template #default="{ id, invalid, describedby }">
              <textarea :id="id" v-model="proses.alasan" class="isian" rows="3" maxlength="1000" :aria-invalid="invalid" :aria-describedby="describedby" />
            </template>
          </KolomIsian>
        </template>

        <div class="flex flex-wrap gap-3">
          <button
            type="submit"
            :class="proses.mode === 'setujui' ? 'tombol-utama' : 'tombol-bahaya'"
            :disabled="proses.sedang || (proses.mode === 'setujui' && !unitPilihan.length)"
          >
            {{ proses.sedang ? 'Memproses…' : proses.mode === 'setujui' ? 'Setujui pendaftaran' : 'Tolak dan hapus akun' }}
          </button>
          <button type="button" class="tombol-kedua" @click="dialog?.tutup()">Batal</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
