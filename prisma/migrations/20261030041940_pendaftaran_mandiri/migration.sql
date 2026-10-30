-- CreateEnum
CREATE TYPE "SumberPendaftaran" AS ENUM ('undangan', 'mandiri');

-- CreateEnum
CREATE TYPE "StatusPendaftaran" AS ENUM ('menunggu', 'disetujui');

-- AlterTable
ALTER TABLE "narasumber" ADD COLUMN     "keterangan_pendaftaran" TEXT,
ADD COLUMN     "status_pendaftaran" "StatusPendaftaran" NOT NULL DEFAULT 'disetujui',
ADD COLUMN     "sumber" "SumberPendaftaran" NOT NULL DEFAULT 'undangan';
