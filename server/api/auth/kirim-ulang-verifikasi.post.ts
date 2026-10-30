// FR-02: kirim ulang dibatasi 3 kali per jam.
export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  if (akun.email_verified_at) return { ok: true, sudahTerverifikasi: true }

  const jumlah = await prisma.tokenAkun.count({
    where: { user_id: akun.id, jenis: 'verifikasi', created_at: { gt: new Date(Date.now() - 60 * 60_000) } },
  })
  // Token pertama dibuat saat mendaftar, jadi batas 3 kirim ulang = 4 token per jam.
  if (jumlah >= 4) {
    throw createError({ statusCode: 429, message: 'Batas kirim ulang 3 kali per jam sudah tercapai. Coba lagi nanti.' })
  }
  if (!(await kirimVerifikasi(akun.id, akun.email))) {
    throw createError({ statusCode: 502, message: 'Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.' })
  }
  return { ok: true, sudahTerverifikasi: false }
})
