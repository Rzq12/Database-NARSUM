// Unit yang dipilih admin menjadi unit pengundang, jadi review data nanti berjalan seperti jalur undangan.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'setujui_pendaftaran')
  const ns = await cariPendaftaranMenunggu(idDariParam(event))
  const { unit_id } = await bacaBody(event, skemaSetujuiPendaftaran)
  if (akun.role === 'admin_unit' && !unitIds(akun).includes(unit_id)) {
    throw galat422({ unit_id: 'Pilih salah satu unit Anda' })
  }
  if (!(await prisma.unit.findUnique({ where: { id: unit_id } }))) throw galat422({ unit_id: 'Unit tidak ditemukan' })

  // Bersyarat "masih menunggu" agar dua admin yang memproses bersamaan tidak saling menimpa.
  const hasil = await prisma.narasumber.updateMany({
    where: { id: ns.id, status_pendaftaran: 'menunggu' },
    data: { status_pendaftaran: 'disetujui', unit_pengundang_id: unit_id },
  })
  if (hasil.count === 0) throw createError({ statusCode: 409, message: 'Pendaftaran ini sudah diproses admin lain.' })
  await catatAudit(event, { pelaku: akun, aksi: 'setujui_pendaftaran', objek: 'narasumber', objekId: ns.id })
  const { subjek, teks } = templatEmail.pendaftaranDisetujui()
  const emailTerkirim = await kirimEmailAman(ns.user.email, subjek, teks)
  return { ok: true, emailTerkirim }
})
