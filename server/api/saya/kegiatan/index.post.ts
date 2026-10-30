// Tambah riwayat kegiatan: isian dan surat tugas (wajib) dalam satu permintaan multipart.
// Bahan (opsional) dikirim terpisah ke /api/saya/kegiatan/:id/bahan agar tiap permintaan di bawah batas 4,5 MB Vercel.
export default defineEventHandler(async (event) => {
  const akun = await requireNarasumberSiapIsi(event)
  const bagian = (await readMultipartFormData(event)) ?? []
  const isian = Object.fromEntries(bagian.filter(b => !b.filename && b.name).map(b => [b.name!, b.data.toString('utf8')]))
  const suratTugas = bagian.find(b => b.name === 'surat_tugas' && b.filename)

  const hasil = skemaKegiatan.safeParse(isian)
  const galat = hasil.success ? {} : galatPerKolom(hasil.error)
  if (!suratTugas) galat.surat_tugas = 'Unggah file surat tugas dalam format PDF'
  if (!hasil.success || !suratTugas) throw galat422(galat)

  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const fileSurat = await simpanBerkasKegiatan(ns.id, 'surat_tugas', suratTugas.data)

  const data = hasil.data
  const k = await prisma.kegiatan.create({
    data: {
      narasumber_id: ns.id,
      nama_kegiatan: data.nama_kegiatan,
      tanggal_kegiatan: new Date(`${data.tanggal_kegiatan}T00:00:00Z`),
      peran: data.peran,
      peran_lainnya: data.peran_lainnya,
      surat_tugas_path: fileSurat.path,
      surat_tugas_nama_asli: suratTugas.filename!.slice(0, 200),
      surat_tugas_ukuran: fileSurat.ukuran,
    },
  })
  await catatAudit(event, { pelaku: akun, aksi: 'tambah_kegiatan', objek: 'kegiatan', objekId: k.id })
  return ringkasKegiatan([k])[0]!
})
