// Pendaftaran mandiri yang menunggu persetujuan. Yang belum memverifikasi email tidak ditampilkan.
export default defineEventHandler(async (event) => {
  await requireFitur(event, 'setujui_pendaftaran')
  const daftar = await prisma.narasumber.findMany({
    where: { status_pendaftaran: 'menunggu', user: { email_verified_at: { not: null } } },
    include: { user: { select: { email: true, no_hp: true, tipe: true, created_at: true } } },
    orderBy: { created_at: 'asc' },
  })
  return daftar.map(n => ({
    id: n.id,
    email: n.user.email,
    no_hp: n.user.no_hp,
    tipe: n.user.tipe ?? 'non_asn',
    keterangan: n.keterangan_pendaftaran,
    didaftarkan_at: n.user.created_at,
  }))
})
