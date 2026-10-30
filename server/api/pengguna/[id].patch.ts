// FR-25: ubah role, status, dan unit akun staf. Perubahan role tercatat.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'kelola_pengguna')
  const id = idDariParam(event)
  const body = await bacaBody(event, skemaUbahPengguna)
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.role === 'narasumber') throw createError({ statusCode: 404, message: 'Akun staf tidak ditemukan.' })
  if (id === akun.id && (body.status === 'nonaktif' || (body.role && body.role !== 'super_admin'))) {
    throw createError({ statusCode: 409, message: 'Anda tidak bisa menonaktifkan atau menurunkan role akun sendiri.' })
  }
  const role = body.role ?? target.role
  if (role === 'admin_unit' && body.unit_ids && body.unit_ids.length === 0) {
    throw galat422({ unit_ids: 'Admin Unit harus ditautkan ke minimal satu unit' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { nama: body.nama, role: body.role, status: body.status } })
    if (body.unit_ids || role !== 'admin_unit') {
      await tx.userUnit.deleteMany({ where: { user_id: id } })
      if (role === 'admin_unit' && body.unit_ids) {
        await tx.userUnit.createMany({ data: body.unit_ids.map(unit_id => ({ user_id: id, unit_id })) })
      }
    }
  })

  if (body.role && body.role !== target.role) {
    await catatAudit(event, { pelaku: akun, aksi: 'ubah_role', objek: 'user', objekId: id, keterangan: `${target.role} ke ${body.role}` })
  }
  if (body.status && body.status !== target.status) {
    await catatAudit(event, { pelaku: akun, aksi: 'ubah_akun', objek: 'user', objekId: id, keterangan: `status ${body.status}` })
  }
  if (body.unit_ids || body.nama) {
    await catatAudit(event, { pelaku: akun, aksi: 'ubah_akun', objek: 'user', objekId: id, keterangan: 'nama atau unit' })
  }
  return { ok: true }
})
