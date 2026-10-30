# agent.md: Database Narasumber Kegiatan LAN

Panduan untuk agen coding yang mengerjakan repo ini. Baca PRD.md, SRS.md, dan FRS.md sebelum mengubah apa pun. Kalau dokumen dan kode berbeda, tanyakan ke pemilik proyek.

## Tentang proyek

Aplikasi web tempat narasumber mengisi dan memperbarui data diri, NPWP, buku tabungan, dan CV. Admin unit, Keuangan, Inspektorat, dan Super Admin melihat data sesuai role. Datanya sensitif, jadi keamanan lebih penting daripada kecepatan menambah fitur.

## Stack

- Nuxt (versi stabil terbaru) dengan TypeScript
- Server API memakai Nitro bawaan Nuxt (`server/api/`)
- PostgreSQL dengan Prisma
- Sesi dan login: `nuxt-auth-utils` (sesi cookie terenkripsi)
- Penyimpanan file: folder lokal di luar `public/`, atau S3-compatible bila ada
- Email: Nodemailer lewat SMTP
- UI: Tailwind CSS
- Validasi: Zod, dipakai bersama di form dan server
- Tes: Vitest dengan `@nuxt/test-utils` untuk logika, Playwright untuk alur utama

## Perintah

```
npm install
npm run dev
npm run lint
npm run test
npm run build
npx prisma migrate dev
```

## Struktur folder

```
pages/
  index.vue
  login.vue
  daftar/[token].vue     pendaftaran lewat link undangan
  verifikasi.vue
  narasumber/            halaman narasumber (profil, dokumen)
  admin/                 halaman staf (daftar NS, review, undangan, log)
components/
middleware/
  auth.ts                cek login di sisi halaman
  role.ts                cek role di sisi halaman
server/
  api/                   semua endpoint, contoh: narasumber/[id].get.ts
  utils/
    auth.ts              ambil sesi dan wajibkan role (requireRole)
    crypto.ts            enkripsi kolom sensitif
    validasi.ts          skema Zod (lihat FRS FR-11)
    audit.ts             tulis log audit
    file.ts              simpan dan ambil dokumen
    prisma.ts            instance Prisma
prisma/schema.prisma
```

## Aturan kode

1. Tulis kode yang paling sederhana. Pilih kode yang mudah dibaca daripada kode yang pintar.
2. Jangan menambah fallback atau kompatibilitas mundur kecuali diminta. Kalau ada yang salah, biarkan gagal dengan pesan yang jelas.
3. Satu fungsi, satu tugas. Hindari abstraksi sebelum ada tiga tempat yang memakainya.
4. Jangan menambah library atau modul Nuxt baru tanpa alasan. Sebutkan alasannya di pesan commit.
5. Nama variabel, kolom, dan fungsi memakai bahasa Indonesia yang sama dengan SRS (contoh: `nik`, `nama_lengkap`, `status_review`). Teks antarmuka berbahasa Indonesia.
6. Validasi selalu dilakukan di server dengan skema Zod dari `server/utils/validasi.ts`. Validasi di form hanya tambahan.
7. Ambil data di halaman dengan `useFetch` atau `$fetch`. Jangan memanggil Prisma dari luar folder `server/`.

## Aturan keamanan (wajib)

- Middleware halaman hanya untuk pengalaman pengguna. Cek role yang sebenarnya dilakukan di setiap endpoint `server/api/` lewat `requireRole`. Acuan: matriks hak akses di SRS bagian 7.
- NIK, NPWP, dan nomor rekening dienkripsi di `server/utils/crypto.ts` sebelum disimpan. Kunci dari `runtimeConfig` (environment variable), jangan masuk repo dan jangan masuk `runtimeConfig.public`.
- Endpoint daftar dan detail mengembalikan data sensitif dalam bentuk tersamar. Membuka data penuh lewat endpoint terpisah yang memanggil `catatAudit` lebih dulu.
- Log audit tidak boleh berisi nilai NIK, NPWP, rekening, atau password.
- Dokumen tidak boleh disajikan dari folder `public/`. Ambil lewat endpoint yang mengecek role dan mencatat audit.
- Cek tipe file dari isi file, bukan hanya ekstensi. Patuhi batas ukuran di FRS FR-15.
- Token undangan dan reset: simpan hash-nya, bukan token mentah.
- Password: argon2id atau bcrypt. Jangan pernah menulis password ke log.
- Jangan commit file `.env`, data contoh yang berisi data asli, atau dokumen narasumber asli. Pakai data palsu untuk pengembangan.

## Aturan data

- NIK unik. Email unik. Nomor HP unik bila dipakai sebagai login.
- Kolom ASN (NIP, pangkat/golongan, eselon) wajib untuk ASN dan kosong untuk non-ASN.
- Status narasumber: `draf`, `menunggu_review`, `disetujui`, `perlu_perbaikan`. Perubahan data oleh narasumber selalu mengembalikan status ke `menunggu_review`.
- Penghapusan data narasumber hanya oleh Super Admin dan bersifat permanen.

## Integrasi MyASN

Detail belum dikonfirmasi. Sampai ada dokumentasi resmi:
- Jangan menebak endpoint atau format token.
- Siapkan satu file `server/utils/myasn.ts` dengan fungsi yang jelas masuk dan keluarnya, dan isi hanya setelah spesifikasi tersedia.
- Bangun dan uji dulu seluruh alur non-ASN.

## Cara bekerja

1. Kerjakan satu kebutuhan FRS per perubahan, sebut ID-nya di pesan commit (contoh: `FR-13: pernyataan kebenaran`).
2. Tulis tes untuk skema validasi dan untuk cek role di endpoint.
3. Jalankan `npm run lint` dan `npm run test` sebelum menyatakan selesai.
4. Jika kebutuhan tidak jelas atau bertabrakan dengan dokumen, berhenti dan tanyakan. Jangan mengarang.

## Definisi selesai

- Kriteria penerimaan di FRS terpenuhi.
- Cek role diuji untuk role yang boleh dan yang tidak boleh.
- Tidak ada data sensitif di log atau di respons API yang tidak perlu.
- Lint dan tes lulus.

## Urutan pengerjaan yang disarankan

1. Skema basis data dan migrasi (SRS bagian 6)
2. Auth non-ASN, undangan, verifikasi email (FR-01 sampai FR-09)
3. Formulir profil dan unggah dokumen (FR-10 sampai FR-17)
4. Review admin dan pencarian (FR-18 sampai FR-24)
5. Manajemen pengguna dan log audit (FR-25 sampai FR-29)
6. Notifikasi email (FR-30)
7. Login MyASN (FR-03), setelah spesifikasi tersedia
