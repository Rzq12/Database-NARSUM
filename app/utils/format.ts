export function formatTanggal(nilai: string | Date | null | undefined) {
  if (!nilai) return ''
  const d = typeof nilai === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(nilai) ? new Date(`${nilai}T00:00:00`) : new Date(nilai)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatWaktu(nilai: string | Date | null | undefined) {
  if (!nilai) return ''
  return new Date(nilai).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatUkuran(byte: number) {
  return byte >= 1024 * 1024 ? `${(byte / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(byte / 1024))} KB`
}

export const LABEL_AKSI: Record<string, string> = {
  login: 'Masuk',
  login_gagal: 'Gagal masuk',
  daftar: 'Pendaftaran narasumber',
  daftar_mandiri: 'Pendaftaran mandiri',
  setujui_pendaftaran: 'Setujui pendaftaran',
  tolak_pendaftaran: 'Tolak pendaftaran',
  verifikasi_email: 'Verifikasi email',
  reset_password: 'Reset password',
  ubah_password: 'Ubah password',
  buat_undangan: 'Buat undangan',
  cabut_undangan: 'Cabut undangan',
  ubah_data: 'Ubah data narasumber',
  unggah_dokumen: 'Unggah dokumen',
  lihat_detail: 'Buka detail narasumber',
  buka_data_sensitif: 'Buka data sensitif',
  unduh_dokumen: 'Unduh dokumen',
  ekspor: 'Ekspor data',
  review: 'Review',
  buat_akun: 'Buat akun staf',
  ubah_akun: 'Ubah akun staf',
  ubah_role: 'Ubah role',
  kelola_unit: 'Kelola unit',
  hapus_data: 'Hapus data narasumber',
}
