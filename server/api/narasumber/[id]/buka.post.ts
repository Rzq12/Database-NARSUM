// FR-19: membuka data sensitif penuh. Log dicatat lebih dulu, tanpa nilai datanya.
export default defineEventHandler(async (event) => {
  const akun = await requireFitur(event, 'buka_sensitif')
  const ns = await cariNarasumberTerlihat(akun, idDariParam(event))
  await catatAudit(event, { pelaku: akun, aksi: 'buka_data_sensitif', objek: 'narasumber', objekId: ns.id })
  return {
    nik: dekripsiAtauNull(ns.nik_enc),
    npwp: dekripsiAtauNull(ns.npwp_enc),
    no_rekening: dekripsiAtauNull(ns.no_rekening_enc),
  }
})
