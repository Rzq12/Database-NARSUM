// FR-07, FR-08: buat link undangan, opsional langsung dikirim ke email tujuan.
// Token mentah hanya dikembalikan sekali di sini; yang disimpan hanya hash-nya.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'buat_undangan')
  const body = await bacaBody(event, skemaUndangan)

  if (akun.role === 'admin_unit' && !unitIds(akun).includes(body.unit_id)) {
    throw galat422({ unit_id: 'Anda hanya bisa mengundang atas nama unit Anda' })
  }
  const unit = await prisma.unit.findUnique({ where: { id: body.unit_id } })
  if (!unit) throw galat422({ unit_id: 'Unit tidak ditemukan' })

  // PRD risiko "data duplikat antar unit": arahkan admin ke data yang sudah ada.
  if (body.email_tujuan) {
    const ada = await prisma.user.findUnique({ where: { email: body.email_tujuan }, include: { narasumber: true } })
    if (ada) {
      const terlihat = ada.narasumber
        && await prisma.narasumber.findFirst({ where: { AND: [{ id: ada.narasumber.id }, whereTerlihat(akun)] }, select: { id: true } })
      throw createError({
        statusCode: 409,
        message: terlihat
          ? 'Narasumber dengan email ini sudah terdaftar. Buka datanya tanpa perlu mengundang ulang.'
          : 'Email ini sudah terdaftar di sistem. Datanya bisa dibuka setelah disetujui unit pengundangnya.',
        data: { narasumber_id: terlihat ? terlihat.id : null },
      })
    }
  }

  const { token, hash } = buatToken()
  const kedaluwarsa = new Date(Date.now() + body.masa_hari * 24 * 60 * 60_000)
  const undangan = await prisma.undangan.create({
    data: {
      token_hash: hash,
      unit_id: unit.id,
      dibuat_oleh: akun.id,
      email_tujuan: body.email_tujuan,
      kedaluwarsa_at: kedaluwarsa,
    },
  })
  const link = urlAplikasi(`/daftar/${token}`)

  const mintaKirim = !!(body.kirim_email && body.email_tujuan)
  let terkirim = false
  if (mintaKirim) {
    const { subjek, teks } = templatEmail.undangan(link, unit.nama, kedaluwarsa)
    terkirim = await kirimEmailAman(body.email_tujuan!, subjek, teks)
    if (terkirim) await prisma.undangan.update({ where: { id: undangan.id }, data: { dikirim_at: new Date() } })
  }

  await catatAudit(event, {
    pelaku: akun,
    aksi: 'buat_undangan',
    objek: 'undangan',
    objekId: undangan.id,
    keterangan: terkirim ? 'dikirim lewat email' : mintaKirim ? 'email gagal dikirim' : undefined,
  })
  // Link tetap dikembalikan walau email gagal, karena token hanya disimpan sebagai hash.
  return { id: undangan.id, link, terkirim, gagalKirim: mintaKirim && !terkirim }
})
