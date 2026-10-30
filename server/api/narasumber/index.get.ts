import type { Prisma } from '../../generated/prisma/client'
import { PENDIDIKAN } from '#shared/utils/validasi'

const PER_HALAMAN = 25
const STATUS: StatusReview[] = ['draf', 'menunggu_review', 'disetujui', 'perlu_perbaikan']

// FR-18, FR-21, FR-22: daftar, cari, dan filter narasumber sesuai kewenangan.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'lihat_daftar')
  const q = getQuery(event)
  const teks = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const filter: Prisma.NarasumberWhereInput[] = [whereTerlihat(akun)]
  const cari = teks(q.q)
  if (cari) {
    filter.push({
      OR: [
        { nama_lengkap: { contains: cari, mode: 'insensitive' } },
        { nip: { contains: cari } },
        { instansi: { contains: cari, mode: 'insensitive' } },
        { jabatan: { contains: cari, mode: 'insensitive' } },
        { user: { email: { contains: cari, mode: 'insensitive' } } },
      ],
    })
  }
  if (STATUS.includes(q.status as StatusReview)) filter.push({ status_review: q.status as StatusReview })
  if (teks(q.instansi)) filter.push({ instansi: { contains: teks(q.instansi), mode: 'insensitive' } })
  if ((PENDIDIKAN as readonly string[]).includes(teks(q.pendidikan))) filter.push({ pendidikan_terakhir: teks(q.pendidikan) })
  if (Number(q.unit) > 0) filter.push({ unit_pengundang_id: Number(q.unit) })

  const halaman = Math.max(1, Number(q.halaman) || 1)
  const where = { AND: filter }
  const [total, baris] = await Promise.all([
    prisma.narasumber.count({ where }),
    prisma.narasumber.findMany({
      where,
      orderBy: { updated_at: q.urut === 'lama' ? 'asc' : 'desc' },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: { user: { select: { email: true, tipe: true } }, unit_pengundang: { select: { nama: true } } },
    }),
  ])

  return {
    total,
    halaman,
    perHalaman: PER_HALAMAN,
    items: baris.map(n => ({
      id: n.id,
      nama_lengkap: n.nama_lengkap,
      email: n.user.email,
      tipe: n.user.tipe,
      instansi: n.instansi,
      jabatan: n.jabatan,
      status_review: n.status_review,
      unit_pengundang: n.unit_pengundang?.nama ?? null,
      updated_at: n.updated_at,
    })),
  }
})
