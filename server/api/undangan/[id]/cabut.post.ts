// FR-09: cabut undangan yang belum dipakai.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'buat_undangan')
  const undangan = await prisma.undangan.findUnique({ where: { id: idDariParam(event) } })
  if (!undangan || (akun.role === 'admin_unit' && !unitIds(akun).includes(undangan.unit_id))) {
    throw createError({ statusCode: 404, message: 'Undangan tidak ditemukan.' })
  }
  if (undangan.dipakai_at) throw createError({ statusCode: 409, message: 'Undangan sudah dipakai dan tidak bisa dicabut.' })
  if (!undangan.dicabut_at) {
    await prisma.undangan.update({ where: { id: undangan.id }, data: { dicabut_at: new Date() } })
    await catatAudit(event, { pelaku: akun, aksi: 'cabut_undangan', objek: 'undangan', objekId: undangan.id })
  }
  return { ok: true }
})
