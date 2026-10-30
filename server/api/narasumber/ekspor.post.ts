import { z } from 'zod'
import ExcelJS from 'exceljs'
import { KOLOM_SENSITIF } from '#shared/utils/validasi'

const KOLOM_TAMBAHAN = { email: 'Email', status_review: 'Status review', unit_pengundang: 'Unit pengundang' } as const
type KolomEkspor = KolomProfil | keyof typeof KOLOM_TAMBAHAN
const LABEL: Record<KolomEkspor, string> = { ...LABEL_KOLOM, ...KOLOM_TAMBAHAN }

const skemaEkspor = z.object({
  ids: z.array(z.number().int().positive()).min(1, 'Pilih minimal satu narasumber').max(5000),
  kolom: z.array(z.enum(Object.keys(LABEL) as [KolomEkspor, ...KolomEkspor[]])).min(1, 'Pilih minimal satu kolom'),
  format: z.enum(['xlsx', 'csv']),
})

// Mencegah sel CSV dibaca sebagai rumus saat dibuka di spreadsheet. XLSX tidak perlu: sel ditulis
// sebagai teks, jadi tidak pernah dijalankan sebagai rumus, dan tanda kutip akan ikut tampil sebagai isi.
function amankanSel(v: string) {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
}

// FR-24: ekspor narasumber terpilih dengan pilihan kolom. Setiap ekspor tercatat dengan jumlah baris.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'ekspor')
  const { ids, kolom, format } = await bacaBody(event, skemaEkspor)
  const daftar = await prisma.narasumber.findMany({
    where: { AND: [{ id: { in: ids } }, whereTerlihat(akun)] },
    include: { user: { select: { email: true } }, unit_pengundang: { select: { nama: true } } },
    orderBy: { nama_lengkap: 'asc' },
  })

  const baris = daftar.map((n) => {
    const profil = profilDariDb(n, 'penuh')
    const nilai: Record<KolomEkspor, string> = {
      ...Object.fromEntries(Object.entries(profil).map(([k, v]) => [k, v ?? ''])) as Record<KolomProfil, string>,
      email: n.user.email,
      status_review: LABEL_STATUS[n.status_review],
      unit_pengundang: n.unit_pengundang?.nama ?? '',
    }
    return kolom.map(k => nilai[k])
  })

  const sensitif = kolom.filter(k => (KOLOM_SENSITIF as string[]).includes(k))
  await catatAudit(event, {
    pelaku: akun,
    aksi: 'ekspor',
    objek: 'narasumber',
    keterangan: `${baris.length} baris, format ${format}, kolom: ${kolom.join(', ')}${sensitif.length ? ' (termasuk kolom sensitif)' : ''}`,
  })

  const nama = `narasumber-${new Date().toISOString().slice(0, 10)}.${format}`
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${nama}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  if (format === 'csv') {
    const sel = (v: string) => `"${amankanSel(v).replace(/"/g, '""')}"`
    const isi = [kolom.map(k => LABEL[k]), ...baris].map(b => b.map(sel).join(',')).join('\r\n')
    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    return `﻿${isi}`
  }

  const buku = new ExcelJS.Workbook()
  const lembar = buku.addWorksheet('Narasumber')
  lembar.addRow(kolom.map(k => LABEL[k])).font = { bold: true }
  // Semua sel sebagai teks supaya NIK dan rekening tidak berubah jadi angka berpangkat.
  for (const b of baris) lembar.addRow(b).eachCell((c) => { c.numFmt = '@' })
  lembar.columns.forEach((c) => { c.width = 22 })
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  return Buffer.from(await buku.xlsx.writeBuffer())
})
