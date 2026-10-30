// Pembagian formulir sesuai SRS 3.1: Data Diri, Data Kepegawaian, Kontak, Rekening, Dokumen.
export const BAGIAN: { id: string, judul: string, kolom: KolomProfil[] }[] = [
  { id: 'data-diri', judul: 'Data diri', kolom: ['nama_lengkap', 'nik', 'npwp', 'tempat_lahir', 'tanggal_lahir', 'agama', 'pendidikan_terakhir'] },
  { id: 'kepegawaian', judul: 'Data kepegawaian', kolom: ['nip', 'pangkat_golongan', 'jabatan', 'eselon', 'instansi', 'alamat_kantor'] },
  { id: 'kontak', judul: 'Kontak', kolom: ['no_telp_hp'] },
  { id: 'rekening', judul: 'Rekening bank', kolom: ['nama_bank', 'no_rekening', 'nama_pemilik_rekening'] },
]

export function kolomTampil(kolom: KolomProfil[], tipe: 'asn' | 'non_asn') {
  return tipe === 'asn' ? kolom : kolom.filter(k => !KOLOM_ASN.includes(k))
}

export function barisDokumen(dokumen: { jenis: JenisDokumen, nama_asli: string }[]) {
  return JENIS_DOKUMEN.map(jenis => ({
    kunci: jenis,
    label: LABEL_DOKUMEN[jenis],
    nilai: dokumen.find(d => d.jenis === jenis)?.nama_asli ?? null,
  }))
}

// Baris lembar data. Tempat dan tanggal lahir digabung seperti formulir kertas.
export function barisLembar(profil: Profil, tipe: 'asn' | 'non_asn', email: string) {
  return BAGIAN.map((b) => {
    const baris: { kunci: string, label: string, nilai: string | null }[] = []
    for (const k of kolomTampil(b.kolom, tipe)) {
      if (k === 'tanggal_lahir') continue
      if (k === 'tempat_lahir') {
        const ttl = [profil.tempat_lahir, formatTanggal(profil.tanggal_lahir)].filter(Boolean).join(', ')
        baris.push({ kunci: 'ttl', label: 'Tempat/tanggal lahir', nilai: ttl || null })
        continue
      }
      baris.push({ kunci: k, label: LABEL_KOLOM[k], nilai: profil[k] })
    }
    if (b.id === 'kontak') baris.push({ kunci: 'email', label: 'Email', nilai: email })
    return { ...b, baris }
  })
}
