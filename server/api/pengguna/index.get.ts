export default defineEventHandler(async (event) => {
  await requireFitur(event, 'kelola_pengguna')
  const daftar = await prisma.user.findMany({
    where: { role: { not: 'narasumber' } },
    include: { units: { include: { unit: true } } },
    orderBy: [{ role: 'asc' }, { email: 'asc' }],
  })
  return daftar.map(u => ({
    id: u.id,
    nama: u.nama,
    email: u.email,
    role: u.role,
    status: u.status,
    sudah_atur_password: !!u.password_hash,
    units: u.units.map(x => ({ id: x.unit.id, nama: x.unit.nama })),
  }))
})
