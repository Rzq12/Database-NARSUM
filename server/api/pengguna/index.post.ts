// FR-25: akun staf dibuat Super Admin. Password dibuat sendiri oleh pemilik akun lewat link email,
// jadi Super Admin tidak pernah mengetahui password staf.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'kelola_pengguna')
  const body = await bacaBody(event, skemaPenggunaBaru)
  if (await prisma.user.findUnique({ where: { email: body.email } })) {
    throw galat422({ email: 'Email ini sudah dipakai akun lain' })
  }
  const baru = await prisma.user.create({
    data: {
      nama: body.nama,
      email: body.email,
      role: body.role,
      email_verified_at: null,
      units: { create: body.role === 'admin_unit' ? body.unit_ids.map(unit_id => ({ unit_id })) : [] },
    },
  })
  const token = await buatTokenAkun(baru.id, 'reset', 24 * 60)
  const { subjek, teks } = templatEmail.akunStaf(urlAplikasi(`/reset-password?token=${token}`), LABEL_ROLE[body.role])
  await kirimEmail(baru.email, subjek, teks)
  await catatAudit(event, { pelaku: akun, aksi: 'buat_akun', objek: 'user', objekId: baru.id, keterangan: `role ${body.role}` })
  return { id: baru.id }
})
