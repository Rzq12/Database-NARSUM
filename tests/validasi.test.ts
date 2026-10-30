import { describe, expect, it } from 'vitest'
import { cekKelengkapan, skemaDaftar, skemaDaftarMandiri, skemaKegiatan, skemaProfil, skemaReview, skemaTolakPendaftaran } from '../shared/utils/validasi'

// Data palsu untuk pengujian, bukan data orang sungguhan.
const lengkap = {
  nama_lengkap: '[NAMA UJI]',
  nik: '3200000000000001',
  tempat_lahir: 'Kota Uji',
  tanggal_lahir: '1980-01-31',
  npwp: '00.000.000.0-000.000',
  jabatan: 'Jabatan Uji',
  instansi: 'Instansi Uji',
  alamat_kantor: 'Alamat Uji',
  no_telp_hp: '081200000000',
  agama: 'Islam',
  pendidikan_terakhir: 'S2',
  nama_bank: 'Bank Uji',
  no_rekening: '0000 1111 22',
  nama_pemilik_rekening: '[NAMA UJI]',
}

function galatDari(data: Record<string, unknown>) {
  const hasil = skemaProfil.safeParse(data)
  return hasil.success ? {} : Object.fromEntries(hasil.error.issues.map(i => [i.path.join('.'), i.message]))
}

describe('skemaProfil (FR-11)', () => {
  it('menerima data lengkap dan membuang tanda baca NPWP serta spasi rekening', () => {
    const hasil = skemaProfil.parse(lengkap)
    expect(hasil.npwp).toBe('000000000000000')
    expect(hasil.no_rekening).toBe('0000111122')
  })

  it('menganggap kolom kosong sebagai belum diisi (draf)', () => {
    const hasil = skemaProfil.parse({ nama_lengkap: '', nik: '' })
    expect(hasil.nama_lengkap).toBeNull()
    expect(hasil.nik).toBeNull()
  })

  it.each([
    ['nik', '123', 'NIK harus 16 digit angka'],
    ['nip', '12345', 'NIP harus 18 digit angka'],
    ['npwp', '12345678901234', 'NPWP harus 15 atau 16 digit angka'],
    ['no_telp_hp', '0212345', 'Nomor diawali 08 atau +62, 9 sampai 14 digit'],
    ['no_rekening', '12345', 'Nomor rekening hanya angka, 6 sampai 20 digit'],
    ['agama', 'Lainnya', 'Pilih agama dari daftar'],
  ])('menolak %s yang salah', (kolom, nilai, pesan) => {
    expect(galatDari({ [kolom]: nilai })[kolom]).toBe(pesan)
  })

  it('menerima nomor HP berawalan +62', () => {
    expect(galatDari({ no_telp_hp: '+6281200000000' })).toEqual({})
  })

  it('menolak usia di bawah 17 tahun', () => {
    const tahun = new Date().getFullYear() - 10
    expect(galatDari({ tanggal_lahir: `${tahun}-01-01` }).tanggal_lahir).toBe('Usia minimal 17 tahun')
  })

  it('membatasi alamat 500 karakter dan teks lain 255 karakter', () => {
    expect(galatDari({ alamat_kantor: 'a'.repeat(501) }).alamat_kantor).toBe('Maksimal 500 karakter')
    expect(galatDari({ jabatan: 'a'.repeat(256) }).jabatan).toBe('Maksimal 255 karakter')
  })
})

describe('cekKelengkapan (FR-13)', () => {
  it('lengkap untuk non-ASN tanpa kolom ASN', () => {
    expect(cekKelengkapan(skemaProfil.parse(lengkap), 'non_asn')).toEqual({})
  })

  it('mewajibkan NIP, pangkat/golongan, dan eselon untuk ASN', () => {
    expect(Object.keys(cekKelengkapan(skemaProfil.parse(lengkap), 'asn')).sort()).toEqual(['eselon', 'nip', 'pangkat_golongan'])
  })
})

describe('skemaDaftar (FR-01)', () => {
  const dasar = { token: 'x', tipe: 'non_asn', email: 'uji@contoh.test', password: '1234567890', setuju: true }

  it('menolak password kurang dari 10 karakter', () => {
    const hasil = skemaDaftar.safeParse({ ...dasar, password: '123456789' })
    expect(hasil.success).toBe(false)
  })

  it('mewajibkan persetujuan pemrosesan data pribadi', () => {
    expect(skemaDaftar.safeParse({ ...dasar, setuju: false }).success).toBe(false)
  })

  it('menyimpan email dalam huruf kecil', () => {
    expect(skemaDaftar.parse({ ...dasar, email: 'Uji@Contoh.TEST' }).email).toBe('uji@contoh.test')
  })
})

describe('pendaftaran mandiri', () => {
  const dasar = { tipe: 'non_asn', email: 'uji@contoh.test', password: '1234567890', setuju: true }

  it('tidak memerlukan token undangan maupun unit', () => {
    expect(skemaDaftarMandiri.safeParse(dasar).success).toBe(true)
  })

  it('membatasi keterangan 500 karakter dan menganggap kosong sebagai tidak diisi', () => {
    expect(skemaDaftarMandiri.safeParse({ ...dasar, keterangan: 'a'.repeat(501) }).success).toBe(false)
    expect(skemaDaftarMandiri.parse({ ...dasar, keterangan: '' }).keterangan).toBeNull()
  })

  it('mewajibkan alasan penolakan', () => {
    expect(skemaTolakPendaftaran.safeParse({ alasan: '' }).success).toBe(false)
    expect(skemaTolakPendaftaran.safeParse({ alasan: 'Bukan narasumber kegiatan LAN' }).success).toBe(true)
  })
})

describe('skemaReview (FR-20)', () => {
  it('mewajibkan catatan untuk perlu perbaikan', () => {
    expect(skemaReview.safeParse({ hasil: 'perlu_perbaikan' }).success).toBe(false)
    expect(skemaReview.safeParse({ hasil: 'perlu_perbaikan', catatan: 'Perbaiki NPWP' }).success).toBe(true)
  })

  it('tidak mewajibkan catatan untuk disetujui', () => {
    expect(skemaReview.safeParse({ hasil: 'disetujui' }).success).toBe(true)
  })
})

describe('skemaKegiatan (riwayat kegiatan)', () => {
  const sah = { nama_kegiatan: 'Pelatihan Kepemimpinan Administrator', tanggal_kegiatan: '2026-03-12', peran: 'penguji' }

  it('menerima isian lengkap', () => {
    expect(skemaKegiatan.safeParse(sah).success).toBe(true)
  })

  it('menolak peran di luar daftar', () => {
    expect(skemaKegiatan.safeParse({ ...sah, peran: 'moderator' }).success).toBe(false)
  })

  it('mewajibkan keterangan untuk peran lainnya', () => {
    expect(skemaKegiatan.safeParse({ ...sah, peran: 'lainnya', peran_lainnya: '' }).success).toBe(false)
    const hasil = skemaKegiatan.safeParse({ ...sah, peran: 'lainnya', peran_lainnya: 'Moderator' })
    expect(hasil.success && hasil.data.peran_lainnya).toBe('Moderator')
  })

  it('mengosongkan peran_lainnya bila peran bukan lainnya', () => {
    const hasil = skemaKegiatan.safeParse({ ...sah, peran_lainnya: 'Moderator' })
    expect(hasil.success && hasil.data.peran_lainnya).toBeNull()
  })

  it('menolak tanggal yang tidak ada atau terlalu lama', () => {
    expect(skemaKegiatan.safeParse({ ...sah, tanggal_kegiatan: '2026-02-30' }).success).toBe(false)
    expect(skemaKegiatan.safeParse({ ...sah, tanggal_kegiatan: '2026-13-01' }).success).toBe(false)
    expect(skemaKegiatan.safeParse({ ...sah, tanggal_kegiatan: '1999-12-31' }).success).toBe(false)
  })

  it('mewajibkan nama kegiatan', () => {
    expect(skemaKegiatan.safeParse({ ...sah, nama_kegiatan: '  ' }).success).toBe(false)
  })
})
