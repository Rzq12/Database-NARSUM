import { z } from 'zod'

// Jawaban selalu sama dan email dikirim tanpa ditunggu, supaya halaman ini tidak bisa dipakai
// menebak email yang terdaftar, baik dari isi jawaban maupun dari lamanya.
export default defineEventHandler(async (event) => {
  batasiPermintaan(event, 'lupa-password', 5, 15 * 60_000)
  const { email } = await bacaBody(event, z.object({ email: skemaEmail }))
  // Maksimal 3 email reset per alamat per jam, agar kotak masuk orang lain tidak dibanjiri.
  if (!cekBatas(`reset-email:${email}`, 3, 60 * 60_000).boleh) return { ok: true }

  const akun = await prisma.user.findUnique({ where: { email } })
  if (akun && akun.status === 'aktif') {
    const token = await buatTokenAkun(akun.id, 'reset', 60)
    const { subjek, teks } = templatEmail.reset(urlAplikasi(`/reset-password?token=${token}`))
    void kirimEmailAman(akun.email, subjek, teks)
  }
  return { ok: true }
})
