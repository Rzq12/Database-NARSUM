// Daftar unit untuk filter dan formulir undangan. Semua staf boleh melihat nama unit.
export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, ...ROLE_STAF)
  const daftar = await prisma.unit.findMany({ orderBy: { nama: 'asc' } })
  const milik = unitIds(akun)
  return daftar.map(u => ({ id: u.id, nama: u.nama, milik_saya: milik.includes(u.id) }))
})
