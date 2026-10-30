export default defineEventHandler(async (event) => {
  const akun = await requireRole(event, 'narasumber')
  const ns = await prisma.narasumber.findUniqueOrThrow({ where: { user_id: akun.id } })
  const k = await prisma.kegiatan.findFirst({ where: { id: idDariParam(event), narasumber_id: ns.id } })
  if (!k) throw createError({ statusCode: 404, message: 'Riwayat kegiatan tidak ditemukan.' })
  await prisma.kegiatan.delete({ where: { id: k.id } })
  if (k.bahan_path) await hapusFile(k.bahan_path)
  await hapusFile(k.surat_tugas_path)
  await catatAudit(event, { pelaku: akun, aksi: 'hapus_kegiatan', objek: 'kegiatan', objekId: k.id })
  return { ok: true }
})
