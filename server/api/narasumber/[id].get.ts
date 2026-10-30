// FR-19, FR-23: detail dengan data sensitif tersamar. Setiap pembukaan tercatat.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'lihat_daftar')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  await catatAudit(event, { pelaku: akun, aksi: 'lihat_detail', objek: 'narasumber', objekId: ns.id })

  return {
    id: ns.id,
    email: ns.user.email,
    tipe: ns.user.tipe ?? 'non_asn',
    profil: profilDariDb(ns, 'samar'),
    status_review: ns.status_review,
    pernyataan_benar_at: ns.pernyataan_benar_at,
    updated_at: ns.updated_at,
    unit_pengundang: ns.unit_pengundang?.nama ?? null,
    dokumen: ringkasDokumen(ns.dokumen),
    reviews: ns.reviews.map(r => ({
      id: r.id,
      hasil: r.hasil,
      catatan: r.catatan,
      created_at: r.created_at,
      reviewer: r.reviewer.nama ?? r.reviewer.email,
    })),
    boleh: {
      review: bolehReview(akun, ns) && ns.status_review === 'menunggu_review',
      reviewUnit: bolehReview(akun, ns),
      bukaSensitif: boleh(akun.role, 'buka_sensitif'),
      unduh: boleh(akun.role, 'unduh_dokumen'),
      hapus: boleh(akun.role, 'hapus_narasumber'),
    },
  }
})
