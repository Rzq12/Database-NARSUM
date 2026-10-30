export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const k = await prisma.kegiatan.findFirst({ where: { id: idDariParam(event), narasumber_id: ns.id } })
  if (!k) throw createError({ statusCode: 404, message: 'Riwayat kegiatan tidak ditemukan.' })
  return kirimBerkasKegiatan(event, k, berkasDariParam(event))
})
