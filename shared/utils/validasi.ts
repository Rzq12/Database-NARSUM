import { z } from 'zod'

// Aturan validasi FRS FR-11. Dipakai bersama oleh form (tambahan) dan server (wajib).

export const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] as const
export const PENDIDIKAN = ['SMA/sederajat', 'D3', 'D4', 'S1', 'S2', 'S3'] as const
export const ESELON = ['I', 'II', 'III', 'IV', 'V', 'Non-Eselon'] as const

// Kosong dianggap belum diisi, supaya draf boleh menyimpan kolom kosong.
const kosongJadiNull = (v: unknown) => (v === '' || v === undefined ? null : v)
const opsional = <T extends z.ZodType>(s: T) => z.preprocess(kosongJadiNull, s.nullable())
const angkaSaja = (v: unknown) => (typeof v === 'string' ? v.replace(/[\s.\-/]/g, '') : v)

const teks = (maks = 255) => z.string().trim().max(maks, `Maksimal ${maks} karakter`)

export const skemaEmail = z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid'))

export const skemaHp = z.preprocess(
  v => (typeof v === 'string' ? v.replace(/[\s-]/g, '') : v),
  z.string().regex(/^(08\d{7,12}|\+62\d{8,13})$/, 'Nomor diawali 08 atau +62, 9 sampai 14 digit'),
)

export const skemaPassword = z.string().min(10, 'Password minimal 10 karakter').max(200, 'Password terlalu panjang')

function usiaMinimal(tanggal: string, tahun: number): boolean {
  const lahir = new Date(`${tanggal}T00:00:00`)
  const batas = new Date()
  batas.setFullYear(batas.getFullYear() - tahun)
  return lahir <= batas
}

export const skemaProfil = z.object({
  nama_lengkap: opsional(teks()),
  nip: opsional(z.preprocess(angkaSaja, z.string().regex(/^\d{18}$/, 'NIP harus 18 digit angka'))),
  nik: opsional(z.preprocess(angkaSaja, z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'))),
  tempat_lahir: opsional(teks()),
  tanggal_lahir: opsional(
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid')
      .refine(t => usiaMinimal(t, 17), 'Usia minimal 17 tahun'),
  ),
  pangkat_golongan: opsional(teks()),
  npwp: opsional(z.preprocess(angkaSaja, z.string().regex(/^\d{15,16}$/, 'NPWP harus 15 atau 16 digit angka'))),
  jabatan: opsional(teks()),
  eselon: opsional(z.enum(ESELON, 'Pilih eselon dari daftar')),
  instansi: opsional(teks()),
  alamat_kantor: opsional(teks(500)),
  no_telp_hp: opsional(skemaHp),
  agama: opsional(z.enum(AGAMA, 'Pilih agama dari daftar')),
  pendidikan_terakhir: opsional(z.enum(PENDIDIKAN, 'Pilih pendidikan dari daftar')),
  nama_bank: opsional(teks()),
  no_rekening: opsional(z.preprocess(angkaSaja, z.string().regex(/^\d{6,20}$/, 'Nomor rekening hanya angka, 6 sampai 20 digit'))),
  nama_pemilik_rekening: opsional(teks()),
})

export type Profil = z.output<typeof skemaProfil>
export type KolomProfil = keyof Profil

export const KOLOM_ASN: KolomProfil[] = ['nip', 'pangkat_golongan', 'eselon']
export const KOLOM_SENSITIF: KolomProfil[] = ['nik', 'npwp', 'no_rekening']

const KOLOM_WAJIB_UMUM: KolomProfil[] = [
  'nama_lengkap', 'nik', 'tempat_lahir', 'tanggal_lahir', 'npwp', 'jabatan', 'instansi',
  'alamat_kantor', 'no_telp_hp', 'agama', 'pendidikan_terakhir', 'nama_bank', 'no_rekening',
  'nama_pemilik_rekening',
]

export function kolomWajib(tipe: 'asn' | 'non_asn'): KolomProfil[] {
  return tipe === 'asn' ? [...KOLOM_WAJIB_UMUM, ...KOLOM_ASN] : KOLOM_WAJIB_UMUM
}

export const LABEL_KOLOM: Record<KolomProfil, string> = {
  nama_lengkap: 'Nama lengkap',
  nip: 'NIP',
  nik: 'NIK',
  tempat_lahir: 'Tempat lahir',
  tanggal_lahir: 'Tanggal lahir',
  pangkat_golongan: 'Pangkat/golongan',
  npwp: 'NPWP',
  jabatan: 'Jabatan',
  eselon: 'Eselon',
  instansi: 'Instansi',
  alamat_kantor: 'Alamat kantor',
  no_telp_hp: 'No. telepon/HP',
  agama: 'Agama',
  pendidikan_terakhir: 'Pendidikan terakhir',
  nama_bank: 'Nama bank',
  no_rekening: 'No. rekening bank',
  nama_pemilik_rekening: 'Nama pemilik rekening bank',
}

// Kolom yang belum diisi untuk penyimpanan final. Format sudah dicek oleh skemaProfil.
export function cekKelengkapan(profil: Partial<Profil>, tipe: 'asn' | 'non_asn'): Record<string, string> {
  const galat: Record<string, string> = {}
  for (const k of kolomWajib(tipe)) {
    if (profil[k] === null || profil[k] === undefined) galat[k] = `${LABEL_KOLOM[k]} wajib diisi`
  }
  return galat
}

export function galatPerKolom(error: z.ZodError): Record<string, string> {
  const galat: Record<string, string> = {}
  for (const issue of error.issues) {
    const kunci = issue.path.join('.') || '_'
    if (!galat[kunci]) galat[kunci] = issue.message
  }
  return galat
}

export const skemaLogin = z.object({
  identitas: z.string().trim().min(1, 'Isi email atau nomor HP'),
  password: z.string().min(1, 'Isi password'),
})

export const skemaDaftar = z.object({
  token: z.string().min(1),
  tipe: z.enum(['asn', 'non_asn']),
  email: skemaEmail,
  no_hp: opsional(skemaHp),
  password: skemaPassword,
  setuju: z.literal(true, 'Centang persetujuan pemrosesan data pribadi untuk melanjutkan'),
})

export const skemaUndangan = z.object({
  unit_id: z.coerce.number().int().positive('Pilih unit'),
  email_tujuan: opsional(skemaEmail),
  masa_hari: z.coerce.number().int().min(1, 'Minimal 1 hari').max(60, 'Maksimal 60 hari').default(14),
  kirim_email: z.boolean().default(false),
})

export const skemaReview = z.object({
  hasil: z.enum(['disetujui', 'perlu_perbaikan']),
  catatan: opsional(teks(1000)),
}).refine(r => r.hasil === 'disetujui' || !!r.catatan, {
  path: ['catatan'],
  message: 'Tulis catatan perbaikan untuk narasumber',
})

export const ROLE_STAF_ENUM = ['admin_unit', 'keuangan', 'inspektorat', 'super_admin'] as const

export const skemaPenggunaBaru = z.object({
  nama: teks().min(1, 'Isi nama'),
  email: skemaEmail,
  role: z.enum(ROLE_STAF_ENUM, 'Pilih role'),
  unit_ids: z.array(z.number().int().positive()).default([]),
}).refine(p => p.role !== 'admin_unit' || p.unit_ids.length > 0, {
  path: ['unit_ids'],
  message: 'Admin Unit harus ditautkan ke minimal satu unit',
})

export const skemaUbahPengguna = z.object({
  nama: teks().min(1, 'Isi nama').optional(),
  role: z.enum(ROLE_STAF_ENUM).optional(),
  status: z.enum(['aktif', 'nonaktif']).optional(),
  unit_ids: z.array(z.number().int().positive()).optional(),
})

export const skemaUnit = z.object({
  nama: teks().min(2, 'Nama unit minimal 2 karakter'),
})

export const skemaResetPassword = z.object({
  token: z.string().min(1),
  password: skemaPassword,
})

export const skemaUbahPassword = z.object({
  lama: z.string().min(1, 'Isi password lama'),
  baru: skemaPassword,
})
