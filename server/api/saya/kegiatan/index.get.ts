export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const ns = await prisma.narasumber.findUniqueOrThrow({
    where: { user_id: akun.id },
    include: { kegiatan: { orderBy: [{ tanggal_kegiatan: 'desc' }, { id: 'desc' }] } },
  })
  return ringkasKegiatan(ns.kegiatan)
})
