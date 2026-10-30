import { z } from 'zod'

export default defineEventHandler(async (event) => {
  batasiPermintaan(event, 'verifikasi', 20, 15 * 60_000)
  const { token } = await bacaBody(event, z.object({ token: z.string().min(1) }))
  const data = await pakaiTokenAkun(token, 'verifikasi')
  const akun = await prisma.user.update({
    where: { id: data.user_id },
    data: { email_verified_at: new Date() },
    include: { narasumber: { select: { status_pendaftaran: true } } },
  })
  await catatAudit(event, { pelaku: akun, aksi: 'verifikasi_email', objek: 'user', objekId: akun.id })

  // Pendaftaran mandiri baru diteruskan ke admin setelah email terbukti milik pendaftar.
  const menungguPersetujuan = akun.narasumber?.status_pendaftaran === 'menunggu'
  if (menungguPersetujuan) await beritahuAdminPendaftaranBaru(akun.email)
  return { ok: true, menungguPersetujuan }
})
