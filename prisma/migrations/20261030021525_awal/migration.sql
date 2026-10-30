-- CreateEnum
CREATE TYPE "Role" AS ENUM ('narasumber', 'admin_unit', 'keuangan', 'inspektorat', 'super_admin');

-- CreateEnum
CREATE TYPE "TipeNarasumber" AS ENUM ('asn', 'non_asn');

-- CreateEnum
CREATE TYPE "StatusAkun" AS ENUM ('aktif', 'nonaktif');

-- CreateEnum
CREATE TYPE "StatusReview" AS ENUM ('draf', 'menunggu_review', 'disetujui', 'perlu_perbaikan');

-- CreateEnum
CREATE TYPE "JenisDokumen" AS ENUM ('npwp', 'buku_tabungan', 'cv');

-- CreateEnum
CREATE TYPE "HasilReview" AS ENUM ('disetujui', 'perlu_perbaikan');

-- CreateEnum
CREATE TYPE "JenisToken" AS ENUM ('verifikasi', 'reset');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nama" TEXT,
    "email" TEXT NOT NULL,
    "no_hp" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL,
    "tipe" "TipeNarasumber",
    "email_verified_at" TIMESTAMP(3),
    "status" "StatusAkun" NOT NULL DEFAULT 'aktif',
    "gagal_login" INTEGER NOT NULL DEFAULT 0,
    "terkunci_sampai" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_units" (
    "user_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,

    CONSTRAINT "user_units_pkey" PRIMARY KEY ("user_id","unit_id")
);

-- CreateTable
CREATE TABLE "narasumber" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "unit_pengundang_id" INTEGER,
    "nama_lengkap" TEXT,
    "nip" TEXT,
    "nik_enc" TEXT,
    "nik_indeks" TEXT,
    "tempat_lahir" TEXT,
    "tanggal_lahir" DATE,
    "pangkat_golongan" TEXT,
    "npwp_enc" TEXT,
    "jabatan" TEXT,
    "eselon" TEXT,
    "instansi" TEXT,
    "alamat_kantor" TEXT,
    "no_telp_hp" TEXT,
    "agama" TEXT,
    "pendidikan_terakhir" TEXT,
    "nama_bank" TEXT,
    "no_rekening_enc" TEXT,
    "nama_pemilik_rekening" TEXT,
    "status_review" "StatusReview" NOT NULL DEFAULT 'draf',
    "pernyataan_benar_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narasumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen" (
    "id" SERIAL NOT NULL,
    "narasumber_id" INTEGER NOT NULL,
    "jenis" "JenisDokumen" NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,
    "nama_asli" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "undangan" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "dibuat_oleh" INTEGER NOT NULL,
    "email_tujuan" TEXT,
    "kedaluwarsa_at" TIMESTAMP(3) NOT NULL,
    "dipakai_at" TIMESTAMP(3),
    "dicabut_at" TIMESTAMP(3),
    "dikirim_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "undangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" SERIAL NOT NULL,
    "narasumber_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "hasil" "HasilReview" NOT NULL,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_akun" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "jenis" "JenisToken" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "kedaluwarsa_at" TIMESTAMP(3) NOT NULL,
    "dipakai_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_akun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "pelaku" TEXT,
    "aksi" TEXT NOT NULL,
    "objek" TEXT,
    "objek_id" TEXT,
    "keterangan" TEXT,
    "ip" TEXT,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_no_hp_key" ON "users"("no_hp");

-- CreateIndex
CREATE UNIQUE INDEX "units_nama_key" ON "units"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "narasumber_user_id_key" ON "narasumber"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "narasumber_nik_indeks_key" ON "narasumber"("nik_indeks");

-- CreateIndex
CREATE INDEX "narasumber_status_review_idx" ON "narasumber"("status_review");

-- CreateIndex
CREATE INDEX "narasumber_nama_lengkap_idx" ON "narasumber"("nama_lengkap");

-- CreateIndex
CREATE INDEX "narasumber_instansi_idx" ON "narasumber"("instansi");

-- CreateIndex
CREATE UNIQUE INDEX "dokumen_narasumber_id_jenis_key" ON "dokumen"("narasumber_id", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "undangan_token_hash_key" ON "undangan"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "token_akun_token_hash_key" ON "token_akun"("token_hash");

-- CreateIndex
CREATE INDEX "token_akun_user_id_jenis_created_at_idx" ON "token_akun"("user_id", "jenis", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_waktu_idx" ON "audit_log"("waktu");

-- CreateIndex
CREATE INDEX "audit_log_aksi_idx" ON "audit_log"("aksi");

-- AddForeignKey
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_units" ADD CONSTRAINT "user_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narasumber" ADD CONSTRAINT "narasumber_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narasumber" ADD CONSTRAINT "narasumber_unit_pengundang_id_fkey" FOREIGN KEY ("unit_pengundang_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_narasumber_id_fkey" FOREIGN KEY ("narasumber_id") REFERENCES "narasumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan" ADD CONSTRAINT "undangan_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan" ADD CONSTRAINT "undangan_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_narasumber_id_fkey" FOREIGN KEY ("narasumber_id") REFERENCES "narasumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_akun" ADD CONSTRAINT "token_akun_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
