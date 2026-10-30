-- CreateEnum
CREATE TYPE "PeranKegiatan" AS ENUM ('narasumber', 'penguji', 'penceramah', 'pembicara', 'lainnya');

-- CreateTable
CREATE TABLE "kegiatan" (
    "id" SERIAL NOT NULL,
    "narasumber_id" INTEGER NOT NULL,
    "nama_kegiatan" TEXT NOT NULL,
    "tanggal_kegiatan" DATE NOT NULL,
    "peran" "PeranKegiatan" NOT NULL,
    "peran_lainnya" TEXT,
    "bahan_path" TEXT NOT NULL,
    "bahan_nama_asli" TEXT NOT NULL,
    "bahan_ukuran" INTEGER NOT NULL,
    "surat_tugas_path" TEXT NOT NULL,
    "surat_tugas_nama_asli" TEXT NOT NULL,
    "surat_tugas_ukuran" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kegiatan_narasumber_id_tanggal_kegiatan_idx" ON "kegiatan"("narasumber_id", "tanggal_kegiatan");

-- AddForeignKey
ALTER TABLE "kegiatan" ADD CONSTRAINT "kegiatan_narasumber_id_fkey" FOREIGN KEY ("narasumber_id") REFERENCES "narasumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
