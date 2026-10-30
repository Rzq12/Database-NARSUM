export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const jenis = jenisDariParam(event)
  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const dok = await prisma.dokumen.findUnique({ where: { narasumber_id_jenis: { narasumber_id: ns.id, jenis } } })
  if (!dok) throw createError({ statusCode: 404, message: 'Dokumen belum diunggah.' })
  return kirimDokumen(event, dok)
})
