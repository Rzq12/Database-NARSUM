export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'buat_undangan')
  const daftar = await prisma.undangan.findMany({
    where: akun.role === 'super_admin' ? {} : { unit_id: { in: unitIds(akun) } },
    include: { unit: { select: { nama: true } }, pembuat: { select: { email: true, nama: true } } },
    orderBy: { created_at: 'desc' },
    take: 200,
  })
  const sekarang = new Date()
  const statusUndangan = (u: typeof daftar[number]) =>
    u.dicabut_at ? 'dicabut' as const
    : u.dipakai_at ? 'dipakai' as const
    : u.kedaluwarsa_at < sekarang ? 'kedaluwarsa' as const
    : 'belum_dipakai' as const
  return daftar.map(u => ({
    id: u.id,
    unit: u.unit.nama,
    email_tujuan: u.email_tujuan,
    pembuat: u.pembuat.nama ?? u.pembuat.email,
    created_at: u.created_at,
    kedaluwarsa_at: u.kedaluwarsa_at,
    dikirim_at: u.dikirim_at,
    status: statusUndangan(u),
  }))
})
