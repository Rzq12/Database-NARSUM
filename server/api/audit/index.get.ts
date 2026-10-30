import type { Prisma } from '../../generated/prisma/client'

const PER_HALAMAN = 50

// FR-29: hanya baca. Tidak ada endpoint untuk mengubah atau menghapus log.
export default defineEventHandler(async (event) => {
  await requireFitur(event, 'log_audit')
  const q = getQuery(event)
  const teks = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const tanggal = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

  const where: Prisma.AuditLogWhereInput = {}
  const dari = tanggal(teks(q.dari))
  const sampai = tanggal(teks(q.sampai))
  if (dari || sampai) {
    where.waktu = {
      ...(dari ? { gte: new Date(`${dari}T00:00:00+07:00`) } : {}),
      ...(sampai ? { lte: new Date(`${sampai}T23:59:59.999+07:00`) } : {}),
    }
  }
  if (teks(q.pelaku)) where.pelaku = { contains: teks(q.pelaku), mode: 'insensitive' }
  if (teks(q.aksi)) where.aksi = teks(q.aksi)

  const halaman = Math.max(1, Number(q.halaman) || 1)
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { waktu: 'desc' },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
    }),
  ])
  return { total, halaman, perHalaman: PER_HALAMAN, items }
})
