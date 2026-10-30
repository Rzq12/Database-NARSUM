// Dipakai halaman /daftar/[token] untuk menampilkan status link sebelum narasumber mengisi apa pun.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') ?? ''
  const undangan = await prisma.undangan.findUnique({
    where: { token_hash: hashToken(token) },
    include: { unit: true },
  })
  if (!undangan) return { status: 'tidak_ada' as const }
  if (undangan.dicabut_at) return { status: 'dicabut' as const }
  if (undangan.dipakai_at) return { status: 'dipakai' as const }
  if (undangan.kedaluwarsa_at < new Date()) return { status: 'kedaluwarsa' as const }
  return {
    status: 'berlaku' as const,
    unit: undangan.unit.nama,
    email_tujuan: undangan.email_tujuan,
    kedaluwarsa_at: undangan.kedaluwarsa_at,
  }
})
