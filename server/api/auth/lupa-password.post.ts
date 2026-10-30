import { z } from 'zod'

// Jawaban selalu sama, supaya halaman ini tidak bisa dipakai menebak email yang terdaftar.
export default defineEventHandler(async (event) => {
  const { email } = await bacaBody(event, z.object({ email: skemaEmail }))
  const akun = await prisma.user.findUnique({ where: { email } })
  if (akun && akun.status === 'aktif') {
    const token = await buatTokenAkun(akun.id, 'reset', 60)
    const { subjek, teks } = templatEmail.reset(urlAplikasi(`/reset-password?token=${token}`))
    await kirimEmail(akun.email, subjek, teks)
  }
  return { ok: true }
})
