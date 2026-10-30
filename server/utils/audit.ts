import type { H3Event } from 'h3'

export type AksiAudit =
  | 'login' | 'login_gagal' | 'daftar' | 'daftar_mandiri' | 'setujui_pendaftaran' | 'tolak_pendaftaran' | 'verifikasi_email' | 'reset_password' | 'ubah_password'
  | 'buat_undangan' | 'cabut_undangan' | 'ubah_data' | 'unggah_dokumen' | 'lihat_detail'
  | 'buka_data_sensitif' | 'unduh_dokumen' | 'ekspor' | 'review' | 'buat_akun' | 'ubah_akun'
  | 'ubah_role' | 'kelola_unit' | 'hapus_data' | 'tambah_kegiatan' | 'hapus_kegiatan'

// Jangan pernah memasukkan nilai NIK, NPWP, rekening, atau password ke keterangan (NFR-20).
export async function catatAudit(event: H3Event, entri: {
  pelaku?: { id: number, email: string } | null
  aksi: AksiAudit
  objek?: string
  objekId?: string | number
  keterangan?: string
}) {
  await prisma.auditLog.create({
    data: {
      user_id: entri.pelaku?.id ?? null,
      pelaku: entri.pelaku?.email ?? null,
      aksi: entri.aksi,
      objek: entri.objek ?? null,
      objek_id: entri.objekId?.toString() ?? null,
      keterangan: entri.keterangan ?? null,
      ip: ipKlien(event),
    },
  })
}
