// FR-15, FR-16: unggah atau ganti dokumen. Dokumen lama diganti oleh yang baru.
export default defineEventHandler(async (event) => {
  const akun = await requireNarasumberSiapIsi(event)
  const jenis = jenisDariParam(event)
  const bagian = (await readMultipartFormData(event))?.find(b => b.name === 'berkas' && b.filename)
  if (!bagian) throw createError({ statusCode: 422, message: 'Pilih file yang akan diunggah.' })

  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const lama = await prisma.dokumen.findUnique({ where: { narasumber_id_jenis: { narasumber_id: ns.id, jenis } } })
  const baru = await simpanDokumen(ns.id, jenis, bagian.data)
  const namaAsli = bagian.filename!.slice(0, 200)

  await prisma.dokumen.upsert({
    where: { narasumber_id_jenis: { narasumber_id: ns.id, jenis } },
    create: { narasumber_id: ns.id, jenis, nama_asli: namaAsli, ...baru },
    update: { nama_asli: namaAsli, uploaded_at: new Date(), ...baru },
  })
  if (lama) await hapusFile(lama.path)

  // Dokumen yang berganti setelah final perlu diperiksa ulang (FR-14).
  if (ns.status_review !== 'draf' && ns.status_review !== 'menunggu_review') {
    await prisma.narasumber.update({ where: { id: ns.id }, data: { status_review: 'menunggu_review' } })
  }
  await catatAudit(event, { pelaku: akun, aksi: 'unggah_dokumen', objek: 'narasumber', objekId: ns.id, keterangan: jenis })
  return { jenis, nama_asli: namaAsli, ukuran: baru.ukuran }
})
