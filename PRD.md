# PRD: Database Narasumber Kegiatan LAN

Versi 0.1 | 30 Oktober 2026 | Status: Draft untuk review

## 1. Ringkasan

Database Narasumber Kegiatan LAN adalah aplikasi web untuk menyimpan data narasumber yang mengisi kegiatan di lingkungan LAN. Narasumber mengisi dan memperbarui datanya sendiri lewat link undangan. Admin kegiatan memeriksa dan memakai data itu, sehingga tidak perlu lagi meminta data yang sama berulang kali lewat WhatsApp atau email.

## 2. Masalah

- Setiap unit meminta data narasumber sendiri-sendiri, dengan format yang berbeda.
- Narasumber yang sama mengirim NPWP, buku tabungan, dan CV berkali-kali untuk kegiatan berbeda.
- Data tersebar di chat, email, dan folder pribadi. Sulit dicari, sulit diverifikasi, dan berisiko bocor.
- Keuangan sering menerima data rekening yang salah atau tidak lengkap saat pembayaran honor.

## 3. Tujuan

1. Satu data induk narasumber yang bisa dipakai semua unit.
2. Narasumber mengisi sendiri, data selalu bisa diperbaiki oleh pemiliknya.
3. Data sensitif (NIK, NPWP, rekening) tersimpan aman dan akses ke data itu tercatat.
4. Admin unit, Keuangan, dan Inspektorat mendapat akses sesuai kewenangan masing-masing.

### Ukuran keberhasilan

| Metrik | Target |
|---|---|
| Narasumber baru yang menyelesaikan pengisian setelah menerima link | 80% dalam 7 hari |
| Permintaan ulang data ke narasumber lama | Turun ke mendekati 0 |
| Data rekening salah yang ditemukan Keuangan saat pembayaran | Turun minimal 70% |
| Waktu admin menyiapkan daftar narasumber untuk satu kegiatan | Di bawah 10 menit |

## 4. Pengguna dan role

| Role | Siapa | Kebutuhan utama |
|---|---|---|
| Narasumber | ASN dan non-ASN yang diundang | Mengisi, melihat, dan memperbarui data sendiri |
| Admin Unit | Admin kegiatan di tiap unit | Mengirim undangan, memeriksa data, mengambil data narasumber |
| Keuangan | Staf keuangan | Melihat data rekening dan NPWP untuk pembayaran |
| Inspektorat | Pemeriksa | Melihat data dan log audit, tanpa mengubah |
| Super Admin | Pengelola sistem | Mengelola akun, unit, role, dan konfigurasi |

## 5. Alur bisnis

1. Admin Unit membuat link undangan untuk narasumber baru.
2. Narasumber membuka link.
   - Non-ASN: mendaftar dengan email atau nomor HP dan password.
   - ASN: diarahkan masuk lewat MyASN.
3. Narasumber non-ASN memverifikasi email.
4. Narasumber melengkapi data dan dokumen, lalu menyatakan bahwa data sudah benar dan menyimpan.
5. Narasumber bisa melihat dan memperbarui datanya kapan saja.
6. Admin Unit masuk dan memeriksa data yang sudah diisi.
7. Admin Unit lain dapat mengambil data narasumber yang sudah ada di sistem.
8. Hak akses setiap admin mengikuti kewenangannya.

## 6. Ruang lingkup

### Masuk rilis pertama

- Link undangan dengan masa berlaku.
- Pendaftaran non-ASN, verifikasi email, login ASN lewat MyASN.
- Formulir data narasumber dan unggah NPWP, buku tabungan, CV.
- Pernyataan kebenaran data.
- Review oleh Admin Unit: setujui atau minta perbaikan.
- Pencarian, filter, dan ekspor data narasumber.
- Lima role dengan hak akses berbeda.
- Log audit untuk lihat, ubah, dan ekspor data sensitif.

### Belum masuk

- Pembayaran honor dan perhitungan pajak.
- Penjadwalan kegiatan dan penugasan narasumber ke kegiatan.
- Aplikasi mobile native.
- Tanda tangan elektronik.

## 7. Data narasumber

Teks: nama lengkap, NIP, NIK, tempat dan tanggal lahir, pangkat/golongan, NPWP, jabatan, eselon, instansi, alamat kantor, nomor telepon/HP, agama, pendidikan terakhir, nama bank, nomor rekening, nama pemilik rekening, email.

Dokumen: file NPWP, foto buku tabungan, daftar riwayat hidup (CV).

## 8. Kebutuhan data pribadi

Aplikasi menyimpan data pribadi yang bersifat sensitif. Konsekuensinya:

- Data NIK, NPWP, dan rekening dienkripsi saat disimpan.
- Tampilan default menyamarkan data sensitif. Membuka data penuh tercatat di log.
- Dokumen unggahan tidak bisa diakses lewat URL publik.
- Perlu pemberitahuan dasar pemrosesan data pribadi di halaman pendaftaran.
- Perlu aturan retensi data. Lihat pertanyaan terbuka.

## 9. Asumsi

- Aplikasi dipakai internal LAN dan narasumber eksternal lewat internet.
- MyASN menyediakan login berbasis OAuth2/OIDC dan mengembalikan minimal NIP dan nama.
- Server email (SMTP) tersedia untuk verifikasi dan notifikasi.
- Penyimpanan file berada di infrastruktur yang disetujui LAN.

## 10. Risiko

| Risiko | Dampak | Penanganan |
|---|---|---|
| Kebocoran data NIK, NPWP, rekening | Tinggi | Enkripsi, masking, log audit, pembatasan role |
| Integrasi MyASN tertunda | Sedang | Mulai dari non-ASN, ASN menyusul |
| Narasumber tidak mau mengisi | Sedang | Link sederhana, pengingat, formulir singkat |
| Data duplikat antar unit | Sedang | NIK dan email unik, cek sebelum membuat undangan |

## 11. Pertanyaan terbuka

1. Apa dokumentasi teknis dan prosedur akses MyASN yang berlaku?
2. Apakah data ASN dari MyASN boleh diubah narasumber, atau dikunci?
3. Berapa lama data narasumber disimpan setelah tidak aktif?
4. Apakah semua Admin Unit boleh melihat nomor rekening, atau hanya Keuangan?
5. Di mana aplikasi di-hosting (on-premise LAN, pusat data nasional, atau cloud)?
6. Apakah perubahan data oleh narasumber setelah disetujui perlu persetujuan ulang?
7. Apakah dibutuhkan versi bahasa Inggris?

## 12. Tahapan

| Tahap | Isi |
|---|---|
| 1 | Desain data, wireframe, keputusan hosting dan MyASN |
| 2 | Auth, undangan, formulir, unggah dokumen |
| 3 | Review admin, pencarian, ekspor, role dan hak akses |
| 4 | Log audit, pengujian keamanan, UAT |
| 5 | Peluncuran bertahap ke satu unit, lalu semua unit |
