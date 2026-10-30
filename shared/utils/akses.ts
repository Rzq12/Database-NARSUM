// Matriks hak akses, mengikuti SRS bagian 7. Server memakai ini di setiap endpoint lewat requireFitur.
export type Role = 'narasumber' | 'admin_unit' | 'keuangan' | 'inspektorat' | 'super_admin'
export type StatusReview = 'draf' | 'menunggu_review' | 'disetujui' | 'perlu_perbaikan'
export type JenisDokumen = 'npwp' | 'buku_tabungan' | 'cv'

export const ROLE_STAF: Role[] = ['admin_unit', 'keuangan', 'inspektorat', 'super_admin']

export const AKSES = {
  buat_undangan: ['admin_unit', 'super_admin'],
  setujui_pendaftaran: ['admin_unit', 'super_admin'],
  lihat_daftar: ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'],
  buka_sensitif: ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'],
  unduh_dokumen: ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'],
  review: ['admin_unit', 'super_admin'],
  ekspor: ['admin_unit', 'keuangan', 'super_admin'],
  log_audit: ['inspektorat', 'super_admin'],
  kelola_pengguna: ['super_admin'],
  hapus_narasumber: ['super_admin'],
} as const satisfies Record<string, readonly Role[]>

export type Fitur = keyof typeof AKSES

export function boleh(role: Role | undefined, fitur: Fitur): boolean {
  return !!role && (AKSES[fitur] as readonly Role[]).includes(role)
}

export const LABEL_ROLE: Record<Role, string> = {
  narasumber: 'Narasumber',
  admin_unit: 'Admin Unit',
  keuangan: 'Keuangan',
  inspektorat: 'Inspektorat',
  super_admin: 'Super Admin',
}

export const LABEL_STATUS: Record<StatusReview, string> = {
  draf: 'Draf',
  menunggu_review: 'Menunggu review',
  disetujui: 'Disetujui',
  perlu_perbaikan: 'Perlu perbaikan',
}

export const JENIS_DOKUMEN: readonly JenisDokumen[] = ['npwp', 'buku_tabungan', 'cv']

export const LABEL_DOKUMEN: Record<JenisDokumen, string> = {
  npwp: 'NPWP',
  buku_tabungan: 'Foto buku tabungan',
  cv: 'Daftar riwayat hidup (CV)',
}

export type PeranKegiatan = 'narasumber' | 'penguji' | 'penceramah' | 'pembicara' | 'lainnya'
export type BerkasKegiatan = 'bahan' | 'surat_tugas'

export const PERAN_KEGIATAN: readonly PeranKegiatan[] = ['narasumber', 'penguji', 'penceramah', 'pembicara', 'lainnya']

export const LABEL_PERAN: Record<PeranKegiatan, string> = {
  narasumber: 'Narasumber',
  penguji: 'Penguji',
  penceramah: 'Penceramah',
  pembicara: 'Pembicara',
  lainnya: 'Lainnya',
}

export const BERKAS_KEGIATAN: readonly BerkasKegiatan[] = ['bahan', 'surat_tugas']

export const LABEL_BERKAS: Record<BerkasKegiatan, string> = {
  bahan: 'Bahan',
  surat_tugas: 'Surat tugas',
}

export function berandaRole(role: Role): string {
  return role === 'narasumber' ? '/narasumber' : '/admin'
}
