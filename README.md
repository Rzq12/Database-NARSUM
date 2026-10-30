# Database Narasumber Kegiatan LAN

Aplikasi web tempat narasumber kegiatan Lembaga Administrasi Negara mengisi dan memperbarui data diri, NPWP, rekening, CV, dan riwayat kegiatannya sendiri. Admin Unit, Keuangan, Inspektorat, dan Super Admin memakai data yang sama sesuai kewenangan masing-masing, tanpa meminta ulang lewat chat atau email.

Aplikasi ini menyimpan data pribadi sensitif (NIK, NPWP, nomor rekening, dan dokumen). Baca bagian [Keamanan](#keamanan) sebelum mengubah kode atau konfigurasi.

## Dokumen proyek

| Dokumen | Isi |
|---|---|
| [PRD.md](PRD.md) | Latar belakang, tujuan, alur bisnis, pertanyaan terbuka |
| [SRS.md](SRS.md) | Kebutuhan non-fungsional (NFR), model data, matriks hak akses (bagian 7) |
| [FRS.md](FRS.md) | Kebutuhan fungsional FR-01 sampai FR-30 beserta kriteria penerimaan |
| [agent.md](agent.md) | Aturan kode dan keamanan untuk pengembang dan agen coding |

## Stack

- Nuxt 4 (Vue 3, TypeScript) dengan server API Nitro di `server/api/`
- PostgreSQL dengan Prisma 7 (adapter `pg`)
- Sesi cookie terenkripsi lewat `nuxt-auth-utils`, password dengan argon2id
- Validasi Zod yang dipakai bersama oleh formulir dan server (`shared/utils/validasi.ts`)
- Penyimpanan dokumen: folder lokal atau penyimpanan S3-compatible (Supabase Storage)
- Email lewat SMTP (Nodemailer)
- Tailwind CSS, Vitest

## Menjalankan di komputer sendiri

Prasyarat: Node.js 22 atau lebih baru, npm, dan Docker (untuk PostgreSQL lokal).

```bash
npm install
cp .env.example .env        # lalu isi nilainya, lihat bagian Konfigurasi
npm run db:up               # PostgreSQL 17 di localhost:5433
npm run db:migrate          # membuat tabel
npm run db:seed             # membuat akun Super Admin pertama
npm run dev                 # http://localhost:3000
```

Untuk `.env` lokal dengan database dari `docker-compose.yml`:

```
DATABASE_URL="postgresql://narasumber:narasumber_dev@localhost:5433/narasumber"
```

Buat kunci acak untuk `NUXT_SESSION_PASSWORD`, `NUXT_KUNCI_ENKRIPSI`, dan `NUXT_KUNCI_INDEKS` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Di mode pengembangan:

- Kosongkan `NUXT_SMTP_HOST`: email (termasuk link verifikasi dan reset password) dicetak ke konsol server.
- Kosongkan `NUXT_S3_ENDPOINT`: dokumen disimpan di folder `.data/dokumen` (sudah di-ignore git).
- Jalankan seed dengan `SEED_DATA_UJI=1` untuk membuat dua unit uji dan satu akun per role staf (`admin.unit@`, `keuangan@`, `inspektorat@contoh.test`, password sama dengan Super Admin). Jangan lakukan ini di produksi.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi ke `.output/` |
| `npm run lint` | Pemeriksaan tipe (`nuxt typecheck`) |
| `npm run test` | Tes Vitest: skema validasi, matriks hak akses, pembatas permintaan |
| `npm run db:up` | Menyalakan PostgreSQL lokal lewat Docker |
| `npm run db:migrate` | Membuat migrasi baru dan menerapkannya (pengembangan) |
| `npx prisma migrate deploy` | Menerapkan migrasi yang ada (produksi) |
| `npm run db:seed` | Membuat akun Super Admin dari `SEED_SUPERADMIN_EMAIL` dan `SEED_SUPERADMIN_PASSWORD` |

Jalankan `npm run lint` dan `npm run test` sebelum menyatakan perubahan selesai.

## Konfigurasi

Semua konfigurasi lewat variabel lingkungan; contoh lengkap ada di [.env.example](.env.example). Jangan commit `.env`.

| Variabel | Wajib di produksi | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Koneksi PostgreSQL |
| `NUXT_SESSION_PASSWORD` | Ya | Minimal 32 karakter, untuk enkripsi cookie sesi |
| `NUXT_KUNCI_ENKRIPSI` | Ya | 64 karakter hex, kunci AES-256-GCM untuk NIK, NPWP, rekening |
| `NUXT_KUNCI_INDEKS` | Ya | 64 karakter hex, kunci HMAC untuk keunikan NIK |
| `NUXT_SMTP_HOST`, `_PORT`, `_USER`, `_PASS`, `_FROM` | Ya (`HOST`) | Server email. Port 465 memakai TLS, port lain STARTTLS |
| `NUXT_PUBLIC_URL_APLIKASI` | Ya, kecuali di Vercel | Alamat aplikasi untuk link email dan cek asal permintaan (CSRF). Di Vercel diisi otomatis dari alamat produksi proyek |
| `NUXT_S3_ENDPOINT`, `_REGION`, `_BUCKET`, `_ACCESS_KEY_ID`, `_SECRET_ACCESS_KEY` | Ya di Vercel | Penyimpanan dokumen S3-compatible, lihat [Penyimpanan dokumen](#penyimpanan-dokumen) |
| `NUXT_FOLDER_DOKUMEN` | Tidak | Folder dokumen bila tidak memakai S3. Bawaan `.data/dokumen` |
| `NUXT_PERCAYA_PROXY` | Tidak | `true` hanya di belakang reverse proxy yang mengisi `X-Forwarded-For` (termasuk Vercel) |
| `NUXT_CLAMAV_HOST`, `NUXT_CLAMAV_PORT` | Tidak | Pemindaian antivirus unggahan lewat clamd. Bila diisi tetapi tidak bisa dihubungi, unggahan ditolak |
| `NUXT_PUBLIC_MYASN_URL` | Tidak | Alamat MyASN; integrasi login ASN belum dibuat |
| `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD` | Untuk seed | Akun Super Admin pertama |

Di produksi, server menolak berjalan dan menulis daftar variabel yang kurang bila kunci, password sesi, SMTP, atau (di Vercel) S3 belum diatur (`server/plugins/konfigurasi.ts`).

Kunci `NUXT_KUNCI_ENKRIPSI` dan `NUXT_KUNCI_INDEKS` harus sama di semua lingkungan yang memakai basis data yang sama. Data yang dienkripsi dengan kunci lain tidak bisa dibaca, dan kunci yang hilang berarti NIK, NPWP, dan rekening tidak bisa dipulihkan.

## Penyimpanan dokumen

Dokumen narasumber (NPWP, buku tabungan, CV) dan berkas riwayat kegiatan (bahan, surat tugas) disimpan:

- di bucket S3-compatible bila `NUXT_S3_ENDPOINT` diisi, atau
- di folder `NUXT_FOLDER_DOKUMEN` bila kosong.

Bucket harus **privat**. Dokumen tidak pernah disajikan langsung dari storage; semuanya lewat endpoint aplikasi yang mengecek role dan mencatat log audit. Untuk Supabase Storage, endpoint S3-nya `https://<host>/storage/v1/s3` dengan path-style addressing.

Batas ukuran per file:

| Berkas | Format | Maksimal |
|---|---|---|
| NPWP, foto buku tabungan | PDF, JPG, PNG | 2 MB |
| CV | PDF, DOC, DOCX | 4 MB |
| Bahan dan surat tugas kegiatan | PDF | 4 MB |

Tipe file diperiksa dari isinya, bukan dari ekstensi. CV dibatasi 4 MB (FR-15 menyebut 5 MB) karena fungsi Vercel menolak permintaan di atas 4,5 MB; karena itu juga setiap permintaan hanya membawa satu file, dan bahan kegiatan dikirim terpisah setelah kegiatan tersimpan.

## Deploy ke Vercel

1. Hubungkan repo ke Vercel. Preset Nuxt terdeteksi otomatis; `postinstall` menjalankan `prisma generate`, yang tidak membutuhkan koneksi basis data.
2. Isi variabel lingkungan di **Settings → Environment Variables** untuk Production: semua yang wajib di tabel Konfigurasi, termasuk S3, ditambah `NUXT_PERCAYA_PROXY=true`. Simpan kunci dan password sebagai Sensitive. Isi nilai tanpa tanda kutip.
3. Siapkan basis data dari komputer sendiri dengan `DATABASE_URL` produksi:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   Bila basis data memakai pooler (misalnya port 6543 di Supabase) dan migrasi macet, jalankan migrasi lewat koneksi langsung (umumnya port 5432).
4. Deploy ulang setelah mengubah variabel lingkungan; perubahan baru berlaku pada deploy berikutnya.

Bila halaman menampilkan `500 FUNCTION_INVOCATION_FAILED`, buka **Deployments → Logs**. Pesan "Konfigurasi produksi belum lengkap" menyebutkan variabel yang belum terbaca.

### Supabase

Supabase membuka skema `public` lewat Data API untuk siapa pun yang memegang anon key. Migrasi `20261030070000_aktifkan_rls` menyalakan Row Level Security tanpa policy di semua tabel aplikasi, sehingga akses lewat API itu tertutup. Aplikasi tetap berjalan karena terhubung sebagai pemilik tabel, yang tidak terkena RLS. Jangan menambah policy untuk role `anon` atau `authenticated` pada tabel aplikasi.

Sebelum dipakai untuk data sungguhan, pastikan lokasi hosting dan basis data sesuai SRS 2.4 (data tersimpan di infrastruktur yang disetujui LAN) dan UU No. 27 Tahun 2022.

## Struktur folder

```
app/
  pages/            halaman: login, daftar, narasumber/, admin/
  components/       komponen UI (formulir, unggah dokumen, lembar data)
  middleware/       cek login dan role di sisi halaman (hanya untuk pengalaman pengguna)
server/
  api/              endpoint; setiap endpoint mengecek role sendiri
  middleware/       header keamanan, CSRF, batas ukuran body, sesi tidak aktif
  plugins/          cek konfigurasi produksi, CSP, pencabutan sesi
  utils/            auth, enkripsi, file, audit, email, validasi body
shared/utils/       skema Zod dan matriks hak akses, dipakai app dan server
prisma/             skema, migrasi, seed
tests/              tes Vitest
```

## Keamanan

Ringkasan aturan dari [agent.md](agent.md) dan SRS:

- Hak akses dicek di setiap endpoint `server/api/` lewat `requireRole` atau `requireFitur`, mengikuti matriks SRS bagian 7. Middleware halaman hanya untuk pengalaman pengguna.
- NIK, NPWP, dan nomor rekening dienkripsi per kolom (`server/utils/crypto.ts`). Daftar dan detail menampilkan nilai tersamar; membuka nilai penuh tercatat di log audit.
- Dokumen tidak pernah disajikan dari `public/` atau URL publik storage.
- Log audit tidak boleh memuat nilai NIK, NPWP, rekening, atau password, dan tidak bisa diubah atau dihapus lewat aplikasi.
- Sesi berakhir setelah 30 menit tidak aktif untuk staf dan 8 jam untuk narasumber. Logout, ganti password, dan perubahan role atau status mencabut semua sesi akun itu.
- Login terkunci 15 menit setelah 5 kali gagal, dan dibatasi per IP.
- Pakai data palsu untuk pengembangan dan pengujian. Jangan commit `.env`, data asli, atau dokumen narasumber.

## Status fitur

Belum tersedia:

- Login ASN lewat MyASN (FR-03): menunggu dokumentasi resmi; `server/utils/myasn.ts` disiapkan sebagai tempatnya.

Di luar FRS saat ini (perlu dicatat di dokumen kebutuhan):

- Pendaftaran mandiri narasumber tanpa undangan, dengan persetujuan Admin Unit atau Super Admin.
- Riwayat kegiatan narasumber: nama kegiatan, tanggal, peran, bahan (opsional), dan surat tugas.
