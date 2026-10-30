// Tambah riwayat kegiatan. Isian, surat tugas (wajib), dan bahan (opsional) dikirim dalam satu permintaan multipart.
export default defineEventHandler(async (event) => {
  const akun = await requireNarasumberSiapIsi(event)
  const bagian = (await readMultipartFormData(event)) ?? []
  const isian = Object.fromEntries(bagian.filter(b => !b.filename && b.name).map(b => [b.name!, b.data.toString('utf8')]))
  const cariBerkas = (nama: BerkasKegiatan) => bagian.find(b => b.name === nama && b.filename)

  const hasil = skemaKegiatan.safeParse(isian)
  const galat = hasil.success ? {} : galatPerKolom(hasil.error)
  const bahan = cariBerkas('bahan')
  const suratTugas = cariBerkas('surat_tugas')
  if (!suratTugas) galat.surat_tugas = 'Unggah file surat tugas dalam format PDF'
  if (!hasil.success || !suratTugas) throw galat422(galat)

  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const fileSurat = await simpanBerkasKegiatan(ns.id, 'surat_tugas', suratTugas.data)
  let fileBahan = null
  if (bahan) {
    try {
      fileBahan = await simpanBerkasKegiatan(ns.id, 'bahan', bahan.data)
    }
    catch (e) {
      await hapusFile(fileSurat.path)
      throw e
    }
  }

  const data = hasil.data
  const k = await prisma.kegiatan.create({
    data: {
      narasumber_id: ns.id,
      nama_kegiatan: data.nama_kegiatan,
      tanggal_kegiatan: new Date(`${data.tanggal_kegiatan}T00:00:00Z`),
      peran: data.peran,
      peran_lainnya: data.peran_lainnya,
      bahan_path: fileBahan?.path ?? null,
      bahan_nama_asli: bahan && fileBahan ? bahan.filename!.slice(0, 200) : null,
      bahan_ukuran: fileBahan?.ukuran ?? null,
      surat_tugas_path: fileSurat.path,
      surat_tugas_nama_asli: suratTugas.filename!.slice(0, 200),
      surat_tugas_ukuran: fileSurat.ukuran,
    },
  })
  await catatAudit(event, { pelaku: akun, aksi: 'tambah_kegiatan', objek: 'kegiatan', objekId: k.id })
  return ringkasKegiatan([k])[0]
})
