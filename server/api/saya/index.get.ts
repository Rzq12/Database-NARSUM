// Data milik narasumber yang sedang masuk. Data sensitif milik sendiri ditampilkan penuh (SRS 7).
export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const ns = await prisma.narasumber.findUniqueOrThrow({
    where: { user_id: akun.id },
    include: {
      dokumen: true,
      unit_pengundang: true,
      reviews: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  })
  const reviewTerakhir = ns.reviews[0]
  return {
    akun: {
      email: akun.email,
      no_hp: akun.no_hp,
      tipe: akun.tipe ?? 'non_asn',
      terverifikasi: !!akun.email_verified_at,
    },
    profil: profilDariDb(ns, 'penuh'),
    dokumen: ringkasDokumen(ns.dokumen),
    status_review: ns.status_review,
    status_pendaftaran: ns.status_pendaftaran,
    pernyataan_benar_at: ns.pernyataan_benar_at,
    updated_at: ns.updated_at,
    unit_pengundang: ns.unit_pengundang?.nama ?? null,
    catatan_perbaikan: ns.status_review === 'perlu_perbaikan' ? reviewTerakhir?.catatan ?? null : null,
  }
})
