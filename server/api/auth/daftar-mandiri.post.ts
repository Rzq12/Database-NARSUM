// Pendaftaran tanpa undangan. Akun baru bisa mengisi data setelah email terverifikasi
// dan pendaftarannya disetujui Admin Unit atau Super Admin.
export default defineEventHandler(async (event) => {
  batasiPermintaan(event, 'daftar-mandiri', 5, 60 * 60_000)
  const body = await bacaBody(event, skemaDaftarMandiri)
  await pastikanBelumTerdaftar(body.email, body.no_hp)

  const akun = await prisma.user.create({
    data: {
      email: body.email,
      no_hp: body.no_hp,
      password_hash: await buatHashPassword(body.password),
      role: 'narasumber',
      tipe: body.tipe,
      narasumber: {
        create: { sumber: 'mandiri', status_pendaftaran: 'menunggu', keterangan_pendaftaran: body.keterangan },
      },
    },
  })

  const emailTerkirim = await selesaikanPendaftaran(event, akun, 'daftar_mandiri')
  return { ok: true, emailTerkirim }
})
