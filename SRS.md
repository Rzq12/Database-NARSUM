# SRS: Database Narasumber Kegiatan LAN

Software Requirements Specification | Versi 0.1 | 30 Oktober 2026

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menjelaskan kebutuhan perangkat lunak aplikasi Database Narasumber Kegiatan LAN. Pembacanya adalah pengembang, penguji, dan pemilik proses bisnis. Kebutuhan fungsional rinci ada di FRS.md.

### 1.2 Ruang lingkup
Aplikasi web untuk mengumpulkan, menyimpan, memeriksa, dan membagikan data narasumber antar unit di LAN. Latar belakang dan tujuan ada di PRD.md.

### 1.3 Istilah

| Istilah | Arti |
|---|---|
| NS | Narasumber |
| ASN | Aparatur Sipil Negara |
| MyASN | Layanan identitas ASN dari BKN |
| Admin Unit | Admin kegiatan di tiap unit kerja |
| Data sensitif | NIK, NPWP, nomor rekening, dan dokumen terkait |

## 2. Deskripsi umum

### 2.1 Perspektif produk
Aplikasi berdiri sendiri, berbasis web, dan terhubung ke MyASN (login ASN) serta server email (verifikasi dan notifikasi).

### 2.2 Kelas pengguna

| Role | Hak ringkas |
|---|---|
| Narasumber | Mengisi dan mengubah data sendiri |
| Admin Unit | Undang NS, periksa data, cari dan ambil data NS |
| Keuangan | Lihat data NS lengkap untuk pembayaran |
| Inspektorat | Lihat data dan log, hanya baca |
| Super Admin | Kelola akun, unit, role, konfigurasi |

### 2.3 Lingkungan operasi
- Browser modern (Chrome, Edge, Firefox, Safari versi dua rilis terakhir), desktop dan ponsel.
- Server Linux dengan basis data PostgreSQL.

### 2.4 Batasan
- Seluruh antarmuka berbahasa Indonesia.
- Data tersimpan di infrastruktur yang disetujui LAN.
- Mengikuti UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

### 2.5 Asumsi dan ketergantungan
- MyASN menyediakan OAuth2/OIDC dan mengembalikan NIP dan nama.
- SMTP tersedia.
- Detail integrasi MyASN belum dikonfirmasi.

## 3. Kebutuhan antarmuka

### 3.1 Antarmuka pengguna
- Responsif, dapat dipakai di layar 360 px ke atas.
- Formulir narasumber dibagi ke beberapa bagian: Data Diri, Data Kepegawaian, Kontak, Rekening, Dokumen.
- Setiap isian wajib diberi tanda dan pesan kesalahan yang jelas.

### 3.2 Antarmuka eksternal

| Sistem | Tujuan | Protokol |
|---|---|---|
| MyASN | Login dan data dasar ASN | OAuth2/OIDC (perlu konfirmasi) |
| SMTP | Email verifikasi, reset password, notifikasi | SMTP |
| Penyimpanan file | Dokumen unggahan | Disk lokal atau S3-compatible |

## 4. Kebutuhan fungsional (ringkasan)

Rinciannya ada di FRS.md. Kelompok fungsinya:

1. Autentikasi dan akun
2. Undangan narasumber
3. Pengelolaan profil narasumber
4. Unggah dokumen
5. Review oleh admin
6. Pencarian dan ekspor
7. Manajemen pengguna dan role
8. Log audit
9. Notifikasi email

## 5. Kebutuhan non-fungsional

### 5.1 Keamanan
- NFR-01: Semua lalu lintas memakai HTTPS.
- NFR-02: Password disimpan dengan hash kuat (argon2id atau bcrypt), minimal 10 karakter.
- NFR-03: NIK, NPWP, dan nomor rekening dienkripsi di tingkat kolom.
- NFR-04: Dokumen unggahan disimpan di luar folder publik dan diakses lewat URL bertanda tangan atau endpoint dengan pemeriksaan role.
- NFR-05: Akses ke data sensitif dibatasi berdasarkan role di sisi server.
- NFR-06: Login dibatasi percobaan (rate limit) dan akun terkunci sementara setelah 5 kali gagal.
- NFR-07: Sesi berakhir setelah 30 menit tidak aktif untuk akun staf, 8 jam untuk narasumber.
- NFR-08: Perlindungan terhadap OWASP Top 10, termasuk CSRF, XSS, dan SQL injection.
- NFR-09: Unggahan file dipindai tipe dan ukuran. Pemindaian antivirus bila tersedia.
- NFR-10: Link undangan memakai token acak, sekali pakai, dan punya masa berlaku.

### 5.2 Kinerja
- NFR-11: Halaman utama dan formulir termuat dalam 3 detik pada koneksi 4G.
- NFR-12: Pencarian narasumber mengembalikan hasil dalam 2 detik untuk 50.000 data.
- NFR-13: Mendukung 200 pengguna aktif bersamaan.

### 5.3 Ketersediaan dan cadangan
- NFR-14: Ketersediaan 99% pada jam kerja.
- NFR-15: Cadangan basis data dan file harian, disimpan minimal 30 hari.

### 5.4 Keterpakaian
- NFR-16: Narasumber dapat menyelesaikan pengisian dalam 10 menit tanpa panduan.
- NFR-17: Kontras dan ukuran huruf memenuhi WCAG 2.1 AA untuk halaman utama.

### 5.5 Pelindungan data pribadi
- NFR-18: Halaman pendaftaran menampilkan pemberitahuan pemrosesan data pribadi.
- NFR-19: Narasumber dapat meminta penghapusan data lewat admin. Penghapusan dilakukan Super Admin dan dicatat.
- NFR-20: Log audit tidak boleh memuat nilai data sensitif, hanya jenis aksi dan identitas pelaku.

## 6. Model data

### 6.1 Entitas

| Entitas | Isi utama |
|---|---|
| users | id, email, no_hp, password_hash, role, tipe (asn atau non_asn), email_verified_at, status |
| units | id, nama |
| user_units | user_id, unit_id (untuk admin unit) |
| narasumber | id, user_id, data profil (lihat 6.2), status_review, pernyataan_benar_at, updated_at |
| dokumen | id, narasumber_id, jenis (npwp, buku_tabungan, cv), path, mime, ukuran, uploaded_at |
| undangan | id, token_hash, unit_id, dibuat_oleh, kedaluwarsa_at, dipakai_at, email_tujuan (opsional) |
| review | id, narasumber_id, reviewer_id, hasil (disetujui atau perlu_perbaikan), catatan, created_at |
| audit_log | id, user_id, aksi, objek, objek_id, ip, waktu |

### 6.2 Kolom profil narasumber

| Kolom | Tipe | Wajib | Catatan |
|---|---|---|---|
| nama_lengkap | teks | ya | |
| nip | teks 18 digit | ASN | Kosong untuk non-ASN |
| nik | teks 16 digit | ya | Unik, terenkripsi |
| tempat_lahir | teks | ya | |
| tanggal_lahir | tanggal | ya | |
| pangkat_golongan | teks | ASN | |
| npwp | teks 15 atau 16 digit | ya | Terenkripsi |
| jabatan | teks | ya | |
| eselon | pilihan | ASN | I, II, III, IV, V, Non-Eselon |
| instansi | teks | ya | |
| alamat_kantor | teks panjang | ya | |
| no_telp_hp | teks | ya | Format Indonesia |
| agama | pilihan | ya | Islam, Kristen, Katolik, Hindu, Buddha, Konghucu |
| pendidikan_terakhir | pilihan | ya | SMA/sederajat, D3, D4, S1, S2, S3 |
| nama_bank | teks | ya | |
| no_rekening | teks angka | ya | Terenkripsi |
| nama_pemilik_rekening | teks | ya | |
| email | teks | ya | Diambil dari akun |

## 7. Matriks hak akses

| Fitur | Narasumber | Admin Unit | Keuangan | Inspektorat | Super Admin |
|---|---|---|---|---|---|
| Lihat dan ubah data sendiri | Ya | - | - | - | - |
| Buat link undangan | - | Ya | - | - | Ya |
| Lihat daftar semua NS | - | Ya | Ya | Ya | Ya |
| Lihat detail NS (data sensitif tersamar) | - | Ya | Ya | Ya | Ya |
| Buka data sensitif penuh | Milik sendiri | Ya, tercatat | Ya, tercatat | Ya, tercatat | Ya, tercatat |
| Unduh dokumen | Milik sendiri | Ya, tercatat | Ya, tercatat | Ya, tercatat | Ya, tercatat |
| Setujui atau minta perbaikan | - | Ya | - | - | Ya |
| Ekspor data | - | Ya, tercatat | Ya, tercatat | Tidak | Ya, tercatat |
| Ubah data NS | Milik sendiri | Tidak | Tidak | Tidak | Tidak |
| Lihat log audit | - | Tidak | Tidak | Ya | Ya |
| Kelola akun, unit, role | - | Tidak | Tidak | Tidak | Ya |

Catatan: Admin Unit tidak mengubah isi data narasumber. Jika ada kesalahan, admin meminta perbaikan dan narasumber yang mengubah. Ini perlu dikonfirmasi (lihat PRD, pertanyaan terbuka 4).

## 8. Kriteria penerimaan sistem

- Seluruh kebutuhan di FRS lulus uji.
- Uji penetrasi dasar tidak menemukan celah tingkat tinggi.
- UAT disetujui oleh perwakilan Admin Unit, Keuangan, dan Inspektorat.
