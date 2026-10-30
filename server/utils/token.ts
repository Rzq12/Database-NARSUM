// Token verifikasi email dan reset password. Yang disimpan hanya hash-nya.
export async function buatTokenAkun(userId: number, jenis: 'verifikasi' | 'reset', masaBerlakuMenit: number) {
  const { token, hash } = buatToken()
  await prisma.tokenAkun.create({
    data: {
      user_id: userId,
      jenis,
      token_hash: hash,
      kedaluwarsa_at: new Date(Date.now() + masaBerlakuMenit * 60_000),
    },
  })
  return token
}

export async function pakaiTokenAkun(token: string, jenis: 'verifikasi' | 'reset') {
  const data = await prisma.tokenAkun.findUnique({ where: { token_hash: hashToken(token) } })
  if (!data || data.jenis !== jenis || data.dipakai_at || data.kedaluwarsa_at < new Date()) {
    throw createError({ statusCode: 410, message: 'Link sudah tidak berlaku atau sudah dipakai. Minta link baru.' })
  }
  await prisma.tokenAkun.update({ where: { id: data.id }, data: { dipakai_at: new Date() } })
  return data
}

export async function kirimVerifikasi(userId: number, email: string) {
  const token = await buatTokenAkun(userId, 'verifikasi', 24 * 60)
  const { subjek, teks } = templatEmail.verifikasi(urlAplikasi(`/verifikasi?token=${token}`))
  await kirimEmail(email, subjek, teks)
}
