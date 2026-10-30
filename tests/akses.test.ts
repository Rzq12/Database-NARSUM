import { describe, expect, it } from 'vitest'
import { boleh, type Fitur, type Role } from '../shared/utils/akses'

// Matriks harapan disalin dari SRS bagian 7. Setiap sel diuji untuk role yang boleh dan yang tidak.
const MATRIKS: Record<Fitur, Role[]> = {
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
}
const SEMUA_ROLE: Role[] = ['narasumber', 'admin_unit', 'keuangan', 'inspektorat', 'super_admin']

describe('matriks hak akses (SRS 7)', () => {
  for (const [fitur, diizinkan] of Object.entries(MATRIKS) as [Fitur, Role[]][]) {
    for (const role of SEMUA_ROLE) {
      const harapan = diizinkan.includes(role)
      it(`${role} ${harapan ? 'boleh' : 'tidak boleh'} ${fitur}`, () => {
        expect(boleh(role, fitur)).toBe(harapan)
      })
    }
  }

  it('Inspektorat tidak boleh ekspor', () => {
    expect(boleh('inspektorat', 'ekspor')).toBe(false)
  })

  it('tanpa role tidak boleh apa pun', () => {
    expect(boleh(undefined, 'lihat_daftar')).toBe(false)
  })
})
