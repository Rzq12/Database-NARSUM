// FR-27: hapus permanen oleh Super Admin. Log mencatat penghapusan tanpa isi data.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'hapus_narasumber')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  await prisma.user.delete({ where: { id: ns.user_id } })
  await hapusFolderNarasumber(ns.id)
  await catatAudit(event, { pelaku: akun, aksi: 'hapus_data', objek: 'narasumber', objekId: ns.id })
  return { ok: true }
})
