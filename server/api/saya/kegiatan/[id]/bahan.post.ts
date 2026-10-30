// Unggah atau ganti bahan (paparan, hasil penilaian, catatan masukan) untuk kegiatan milik sendiri.
export default defineEventHandler(async (event) => {
  const akun = await requireNarasumberSiapIsi(event)
  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const k = await prisma.kegiatan.findFirst({ where: { id: idDariParam(event), narasumber_id: ns.id } })
  if (!k) throw createError({ statusCode: 404, message: 'Riwayat kegiatan tidak ditemukan.' })
  const bagian = (await readMultipartFormData(event))?.find(b => b.name === 'berkas' && b.filename)
  if (!bagian) throw galat422({ bahan: 'Pilih file bahan dalam format PDF' })

  const baru = await simpanBerkasKegiatan(ns.id, 'bahan', bagian.data)
  const diperbarui = await prisma.kegiatan.update({
    where: { id: k.id },
    data: { bahan_path: baru.path, bahan_nama_asli: bagian.filename!.slice(0, 200), bahan_ukuran: baru.ukuran },
  })
  if (k.bahan_path) await hapusFile(k.bahan_path)
  await catatAudit(event, { pelaku: akun, aksi: 'unggah_dokumen', objek: 'kegiatan', objekId: k.id, keterangan: 'bahan' })
  return ringkasKegiatan([diperbarui])[0]!
})
