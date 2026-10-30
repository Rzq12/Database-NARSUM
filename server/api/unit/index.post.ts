// FR-26: tambah unit.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'kelola_pengguna')
  const { nama } = await bacaBody(event, skemaUnit)
  if (await prisma.unit.findUnique({ where: { nama } })) throw galat422({ nama: 'Unit dengan nama ini sudah ada' })
  const unit = await prisma.unit.create({ data: { nama } })
  await catatAudit(event, { pelaku: akun, aksi: 'kelola_unit', objek: 'unit', objekId: unit.id, keterangan: 'tambah' })
  return unit
})
