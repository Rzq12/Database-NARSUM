// Berkas kegiatan narasumber lain, tercatat di log seperti dokumen (FR-17).
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'unduh_dokumen')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  const berkas = berkasDariParam(event)
  const k = await prisma.kegiatan.findFirst({ where: { id: idDariParam(event, 'kegiatanId'), narasumber_id: ns.id } })
  if (!k) throw createError({ statusCode: 404, message: 'Riwayat kegiatan tidak ditemukan.' })
  await catatAudit(event, { pelaku: akun, aksi: 'unduh_dokumen', objek: 'narasumber', objekId: ns.id, keterangan: `kegiatan ${k.id}: ${berkas}` })
  return kirimBerkasKegiatan(event, k, berkas)
})
