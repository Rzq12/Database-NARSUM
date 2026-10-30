// Login MyASN (FRS FR-03) belum dibangun. Endpoint dan format token belum dikonfirmasi BKN,
// jadi tidak ditebak di sini (lihat agent.md, bagian Integrasi MyASN).
// Sementara itu halaman pendaftaran hanya menautkan ke portal MyASN (runtimeConfig.public.myasnUrl).

export interface ProfilMyAsn {
  nip: string
  nama: string
}

export async function tukarKodeMyAsn(_kode: string): Promise<ProfilMyAsn> {
  throw createError({ statusCode: 501, message: 'Login lewat MyASN belum tersedia.' })
}
