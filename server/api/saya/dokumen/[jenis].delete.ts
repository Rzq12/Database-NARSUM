// FR-16: setelah data final, dokumen wajib hanya bisa diganti, tidak dihapus.
export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const jenis = jenisDariParam(event)
  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  if (ns.status_review !== 'draf') {
    throw createError({ statusCode: 409, message: 'Dokumen wajib tidak bisa dihapus setelah data disimpan final. Unggah file pengganti.' })
  }
  const dok = await prisma.dokumen.findUnique({ where: { narasumber_id_jenis: { narasumber_id: ns.id, jenis } } })
  if (!dok) return { ok: true }
  await prisma.dokumen.delete({ where: { id: dok.id } })
  await hapusFile(dok.path)
  return { ok: true }
})
