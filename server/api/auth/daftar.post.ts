// FR-01: pendaftaran narasumber lewat undangan.
export default defineEventHandler(async (event) => {
  batasiPermintaan(event, 'daftar', 10, 60 * 60_000)
  const body = await bacaBody(event, skemaDaftar)
  await pastikanBelumTerdaftar(body.email, body.no_hp)

  const passwordHash = await buatHashPassword(body.password)
  const akun = await prisma.$transaction(async (tx) => {
    // updateMany dengan syarat belum dipakai mencegah satu link dipakai dua kali secara bersamaan.
    const undangan = await tx.undangan.findUnique({ where: { token_hash: hashToken(body.token) } })
    // Undangan yang ditujukan ke email tertentu hanya bisa dipakai oleh pemilik email itu.
    if (undangan?.email_tujuan && undangan.email_tujuan !== body.email) {
      throw galat422({ email: 'Gunakan email yang tercantum di undangan.' }, 'Email tidak sesuai dengan undangan.')
    }
    const pakai = undangan && await tx.undangan.updateMany({
      where: { id: undangan.id, dipakai_at: null, dicabut_at: null, kedaluwarsa_at: { gt: new Date() } },
      data: { dipakai_at: new Date() },
    })
    if (!undangan || !pakai || pakai.count === 0) {
      throw createError({ statusCode: 410, message: 'Link undangan sudah tidak berlaku. Minta link baru ke admin kegiatan.' })
    }
    return tx.user.create({
      data: {
        email: body.email,
        no_hp: body.no_hp,
        password_hash: passwordHash,
        role: 'narasumber',
        tipe: body.tipe,
        narasumber: { create: { unit_pengundang_id: undangan.unit_id } },
      },
    })
  })

  const emailTerkirim = await selesaikanPendaftaran(event, akun, 'daftar')
  return { ok: true, emailTerkirim }
})
