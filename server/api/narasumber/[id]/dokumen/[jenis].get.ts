// FR-17: unduh dokumen narasumber lain, tercatat di log.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'unduh_dokumen')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  const jenis = jenisDariParam(event)
  const dok = ns.dokumen.find(d => d.jenis === jenis)
  if (!dok) throw createError({ statusCode: 404, message: 'Dokumen belum diunggah.' })
  await catatAudit(event, { pelaku: akun, aksi: 'unduh_dokumen', objek: 'narasumber', objekId: ns.id, keterangan: jenis })
  return kirimDokumen(event, dok)
})
