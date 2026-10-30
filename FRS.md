# FRS: Database Narasumber Kegiatan LAN

Functional Requirements Specification | Versi 0.1 | 30 Oktober 2026

Setiap kebutuhan punya ID (FR-xx) dan kriteria penerimaan (KP). Istilah dan model data mengacu ke SRS.md.

## 1. Autentikasi dan akun

**FR-01 Pendaftaran narasumber non-ASN lewat undangan**
- Narasumber membuka link undangan, memilih "Bukan ASN", mengisi email atau nomor HP, dan password.
- KP: Link kedaluwarsa atau sudah dipakai menampilkan pesan dan tidak bisa dipakai mendaftar. Email atau HP yang sudah terdaftar ditolak dengan arahan untuk login. Password minimal 10 karakter.

**FR-02 Verifikasi email**
- Sistem mengirim email berisi link verifikasi berlaku 24 jam.
- KP: Akun belum terverifikasi tidak bisa mengisi atau menyimpan data. Tersedia tombol kirim ulang, dibatasi 3 kali per jam.

**FR-03 Login ASN lewat MyASN**
- Narasumber ASN memilih "ASN" dan diarahkan ke MyASN. Setelah berhasil, sistem membuat atau memakai akun yang cocok berdasarkan NIP.
- KP: NIP dan nama dari MyASN terisi otomatis. Gagal login MyASN menampilkan pesan dan tombol coba lagi.

**FR-04 Login staf**
- Admin Unit, Keuangan, Inspektorat, dan Super Admin login dengan email dan password.
- KP: Akun dibuat oleh Super Admin. Lima kali gagal mengunci akun 15 menit.

**FR-05 Lupa dan ubah password**
- Pengguna non-ASN dapat reset password lewat email dan mengubah password saat sudah login.
- KP: Link reset berlaku 1 jam dan sekali pakai.

**FR-06 Logout dan sesi**
- KP: Sesi berakhir sesuai NFR-07 dan pengguna diarahkan ke halaman login.

## 2. Undangan narasumber

**FR-07 Buat link undangan**
- Admin Unit membuat link, opsional mengisi email tujuan dan masa berlaku (default 14 hari).
- KP: Link memuat token acak. Daftar undangan menampilkan status: belum dipakai, dipakai, kedaluwarsa.

**FR-08 Kirim undangan lewat email**
- Jika email tujuan diisi, sistem dapat mengirim link langsung.
- KP: Pengiriman tercatat di daftar undangan.

**FR-09 Cabut undangan**
- Admin Unit dapat membatalkan undangan yang belum dipakai.
- KP: Link yang dicabut tidak bisa dipakai.

## 3. Profil narasumber

**FR-10 Mengisi data**
- Narasumber mengisi formulir sesuai tabel kolom di SRS 6.2.
- KP: Isian wajib divalidasi di sisi server. Kolom khusus ASN (NIP, pangkat/golongan, eselon) hanya muncul untuk ASN.

**FR-11 Aturan validasi**

| Kolom | Aturan |
|---|---|
| NIP | 18 digit angka |
| NIK | 16 digit angka, unik di seluruh sistem |
| NPWP | 15 atau 16 digit angka, tanda baca dibuang saat simpan |
| No. telp/HP | Diawali 08 atau +62, 9 sampai 14 digit |
| Email | Format email valid, unik |
| Tanggal lahir | Tanggal lampau, usia 17 tahun ke atas |
| No. rekening | Hanya angka, 6 sampai 20 digit |
| Teks bebas | Maksimal 255 karakter, alamat maksimal 500 |

- KP: Pesan kesalahan muncul di bawah kolom yang salah, dalam bahasa Indonesia.

**FR-12 Simpan draf**
- Narasumber dapat menyimpan data yang belum lengkap sebagai draf.
- KP: Draf tidak terlihat oleh admin untuk keperluan review dan tidak dihitung sebagai data lengkap.

**FR-13 Pernyataan kebenaran dan penyimpanan final**
- Untuk menyimpan final, narasumber mencentang pernyataan: "Saya menyatakan bahwa data yang saya isi adalah benar."
- KP: Tombol simpan final nonaktif sebelum semua kolom wajib, tiga dokumen, dan centang pernyataan terpenuhi. Waktu pernyataan tersimpan.

**FR-14 Melihat dan memperbarui data**
- Narasumber dapat membuka datanya kapan saja dan mengubahnya.
- KP: Setiap simpan ulang menyetel ulang status review ke "Menunggu review" dan mencatat perubahan di log audit. Pernyataan kebenaran harus dicentang lagi.

## 4. Dokumen

**FR-15 Unggah dokumen**
- Tiga jenis: NPWP, foto buku tabungan, CV.

| Jenis | Format | Ukuran maksimal |
|---|---|---|
| NPWP | PDF, JPG, PNG | 2 MB |
| Buku tabungan | PDF, JPG, PNG | 2 MB |
| CV | PDF, DOC, DOCX | 5 MB |

- KP: Format atau ukuran di luar aturan ditolak dengan pesan jelas. Tipe file dicek dari isi file, bukan hanya ekstensi.

**FR-16 Ganti dan hapus dokumen**
- KP: Dokumen lama diganti oleh yang baru. Dokumen wajib tidak bisa dihapus tanpa menggantinya setelah data final.

**FR-17 Pratinjau dan unduh**
- KP: Narasumber melihat dokumennya sendiri. Akses lain mengikuti matriks hak akses dan tercatat di log.

## 5. Review admin

**FR-18 Daftar narasumber menunggu review**
- Admin Unit melihat daftar dengan filter status: Draf, Menunggu review, Disetujui, Perlu perbaikan.
- KP: Daftar dapat diurutkan menurut tanggal pembaruan.

**FR-19 Periksa detail**
- Admin Unit membuka detail dan dokumen narasumber.
- KP: Data sensitif tersamar sampai admin menekan "Tampilkan". Aksi itu tercatat.

**FR-20 Setujui atau minta perbaikan**
- Admin memilih "Disetujui" atau "Perlu perbaikan" dengan catatan wajib untuk perbaikan.
- KP: Narasumber menerima email berisi catatan. Status berubah dan riwayat review tersimpan.

## 6. Pencarian dan ekspor

**FR-21 Cari narasumber**
- Pengguna staf mencari berdasarkan nama, NIP, instansi, jabatan, atau email.
- KP: Hanya narasumber berstatus "Disetujui" muncul untuk Admin Unit lain dan Keuangan. Hasil muncul dalam 2 detik.

**FR-22 Filter**
- Filter: instansi, pendidikan, status review, unit pengundang.

**FR-23 Ambil data narasumber**
- Admin Unit dapat membuka data narasumber yang sudah ada tanpa mengundang ulang.
- KP: Akses tercatat di log dengan nama admin dan waktu.

**FR-24 Ekspor**
- Ekspor ke XLSX atau CSV untuk narasumber terpilih, dengan pilihan kolom.
- KP: Kolom sensitif ikut diekspor hanya untuk role yang berhak. Setiap ekspor dicatat beserta jumlah baris.

## 7. Manajemen pengguna

**FR-25 Kelola akun staf**
- Super Admin membuat, menonaktifkan, dan mengubah role akun staf, serta menautkan Admin Unit ke unit.
- KP: Akun nonaktif tidak bisa login. Perubahan role tercatat.

**FR-26 Kelola unit**
- Super Admin menambah dan mengubah daftar unit.

**FR-27 Hapus data narasumber**
- Super Admin dapat menghapus narasumber atas permintaan resmi.
- KP: Data dan dokumen terhapus permanen. Log audit mencatat penghapusan tanpa memuat isi data.

## 8. Log audit

**FR-28 Pencatatan**
- Aksi yang dicatat: login, login gagal, buat undangan, ubah data, buka data sensitif, unduh dokumen, ekspor, review, ubah role, hapus data.
- KP: Setiap entri memuat pelaku, aksi, objek, IP, dan waktu. Tidak memuat nilai data sensitif.

**FR-29 Melihat log**
- Inspektorat dan Super Admin melihat dan memfilter log menurut tanggal, pelaku, dan aksi.
- KP: Log tidak bisa diubah atau dihapus lewat aplikasi.

## 9. Notifikasi email

**FR-30 Daftar notifikasi**

| Peristiwa | Penerima |
|---|---|
| Undangan dikirim | Narasumber |
| Verifikasi email | Narasumber |
| Reset password | Pengguna terkait |
| Data disetujui | Narasumber |
| Perlu perbaikan | Narasumber |
| Narasumber menyimpan data final atau memperbarui | Admin Unit pengundang |

## 10. Alur status narasumber

```
Draf -> Menunggu review -> Disetujui
                       \-> Perlu perbaikan -> Menunggu review
Disetujui -> (narasumber mengubah data) -> Menunggu review
```
