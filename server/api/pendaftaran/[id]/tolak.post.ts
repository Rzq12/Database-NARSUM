// Pendaftaran yang ditolak dihapus beserta akunnya: belum ada data yang diisi,
// jadi data pribadi pendaftar tidak perlu disimpan. Log audit mencatat penolakan tanpa alasannya.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'setujui_pendaftaran')
  const ns = await cariPendaftaranMenunggu(idDariParam(event))
  const { alasan } = await bacaBody(event, skemaTolakPendaftaran)

  const hasil = await prisma.user.deleteMany({
    where: { id: ns.user_id, narasumber: { status_pendaftaran: 'menunggu' } },
  })
  if (hasil.count === 0) throw createError({ statusCode: 409, message: 'Pendaftaran ini sudah diproses admin lain.' })
  await catatAudit(event, { pelaku: akun, aksi: 'tolak_pendaftaran', objek: 'narasumber', objekId: ns.id })
  const { subjek, teks } = templatEmail.pendaftaranDitolak(alasan)
  const emailTerkirim = await kirimEmailAman(ns.user.email, subjek, teks)
  return { ok: true, emailTerkirim }
})
