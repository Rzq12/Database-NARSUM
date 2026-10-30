// FR-20: setujui atau minta perbaikan. Catatan wajib untuk perbaikan.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'review')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  if (!bolehReview(akun, ns)) {
    throw createError({ statusCode: 403, message: 'Hanya Admin Unit pengundang atau Super Admin yang dapat mereview narasumber ini.' })
  }
  if (ns.status_review !== 'menunggu_review') {
    throw createError({ statusCode: 409, message: 'Hanya data berstatus Menunggu review yang bisa direview.' })
  }
  const { hasil, catatan } = await bacaBody(event, skemaReview)

  await prisma.$transaction([
    prisma.review.create({ data: { narasumber_id: ns.id, reviewer_id: akun.id, hasil, catatan } }),
    prisma.narasumber.update({ where: { id: ns.id }, data: { status_review: hasil } }),
  ])
  await catatAudit(event, { pelaku: akun, aksi: 'review', objek: 'narasumber', objekId: ns.id, keterangan: hasil })

  const { subjek, teks } = hasil === 'disetujui' ? templatEmail.disetujui() : templatEmail.perluPerbaikan(catatan!)
  const emailTerkirim = await kirimEmailAman(ns.user.email, subjek, teks)
  return { status_review: hasil, emailTerkirim }
})
