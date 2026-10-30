// FR-26: ubah nama unit.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'kelola_pengguna')
  const id = idDariParam(event)
  const { nama } = await bacaBody(event, skemaUnit)
  const sama = await prisma.unit.findUnique({ where: { nama } })
  if (sama && sama.id !== id) throw galat422({ nama: 'Unit dengan nama ini sudah ada' })
  const unit = await prisma.unit.update({ where: { id }, data: { nama } })
  await catatAudit(event, { pelaku: akun, aksi: 'kelola_unit', objek: 'unit', objekId: id, keterangan: 'ubah nama' })
  return unit
})
