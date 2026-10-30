import { z } from 'zod'

const skemaSimpan = z.object({
  profil: skemaProfil,
  final: z.boolean(),
  pernyataan: z.boolean().default(false),
})

// FR-12 (draf), FR-13 (final dengan pernyataan), FR-14 (simpan ulang kembali ke menunggu review).
export default defineEventHandler(async (event) => {
  const akun = await requireNarasumberSiapIsi(event)
  const { profil, final, pernyataan } = await bacaBody(event, skemaSimpan)
  const tipe = akun.tipe ?? 'non_asn'
  const ns = await prisma.narasumber.findUniqueOrThrow({
    where: { user_id: akun.id },
    include: { dokumen: { select: { jenis: true } }, unit_pengundang: true },
  })

  if (!final && ns.status_review !== 'draf') {
    throw createError({
      statusCode: 409,
      message: 'Data Anda sudah pernah disimpan final. Simpan perubahan dengan mencentang pernyataan kebenaran data.',
    })
  }

  if (final) {
    const galat = cekKelengkapan(profil, tipe)
    const ada = new Set(ns.dokumen.map(d => d.jenis))
    for (const jenis of JENIS_DOKUMEN) {
      if (!ada.has(jenis)) galat[`dokumen.${jenis}`] = `Unggah ${LABEL_DOKUMEN[jenis]}`
    }
    if (!pernyataan) galat.pernyataan = 'Centang pernyataan kebenaran data untuk menyimpan final'
    if (Object.keys(galat).length) throw galat422(galat, 'Data belum lengkap. Lengkapi isian yang ditandai.')
  }

  if (profil.nik) {
    const kembar = await prisma.narasumber.findFirst({
      where: { nik_indeks: indeksNik(profil.nik), NOT: { id: ns.id } },
      select: { id: true },
    })
    if (kembar) throw galat422({ nik: 'NIK ini sudah terdaftar atas narasumber lain. Hubungi admin kegiatan.' })
  }

  const diperbarui = await prisma.narasumber.update({
    where: { id: ns.id },
    data: {
      ...profilKeDb(profil, tipe),
      ...(final ? { status_review: 'menunggu_review', pernyataan_benar_at: new Date() } : {}),
    },
  })

  await catatAudit(event, {
    pelaku: akun,
    aksi: 'ubah_data',
    objek: 'narasumber',
    objekId: ns.id,
    keterangan: final ? 'simpan final' : 'simpan draf',
  })

  if (final) {
    await prisma.user.update({ where: { id: akun.id }, data: { nama: profil.nama_lengkap } })
    const sesi = await getUserSession(event)
    if (sesi.user && profil.nama_lengkap) await setUserSession(event, { user: { ...sesi.user, nama: profil.nama_lengkap } })
    if (ns.unit_pengundang_id) {
      const admin = await prisma.user.findMany({
        where: { role: 'admin_unit', status: 'aktif', units: { some: { unit_id: ns.unit_pengundang_id } } },
        select: { email: true },
      })
      const { subjek, teks } = templatEmail.dataMasuk(profil.nama_lengkap ?? akun.email, ns.id)
      await Promise.all(admin.map(a => kirimEmailAman(a.email, subjek, teks)))
    }
  }

  return { status_review: diperbarui.status_review }
})
