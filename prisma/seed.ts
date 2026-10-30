import 'dotenv/config'
import { hash } from '@node-rs/argon2'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../server/generated/prisma/client'

// Membuat Super Admin pertama dari .env. Dengan SEED_DATA_UJI=1, juga membuat satu unit dan
// satu akun per role staf untuk pengujian lokal. Jangan jalankan SEED_DATA_UJI di produksi.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

async function buatStaf(email: string, nama: string, role: 'admin_unit' | 'keuangan' | 'inspektorat' | 'super_admin', password: string, unitId?: number) {
  const ada = await prisma.user.findUnique({ where: { email } })
  if (ada) return ada
  return prisma.user.create({
    data: {
      email,
      nama,
      role,
      password_hash: await hash(password, { algorithm: 2 }),
      email_verified_at: new Date(),
      units: unitId ? { create: [{ unit_id: unitId }] } : undefined,
    },
  })
}

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL
  const password = process.env.SEED_SUPERADMIN_PASSWORD
  if (!email || !password || password.length < 10) {
    throw new Error('Isi SEED_SUPERADMIN_EMAIL dan SEED_SUPERADMIN_PASSWORD (minimal 10 karakter) di .env')
  }
  await buatStaf(email, 'Super Admin', 'super_admin', password)
  console.info(`Super Admin: ${email}`)

  if (process.env.SEED_DATA_UJI === '1') {
    const unit = await prisma.unit.upsert({ where: { nama: 'Unit Uji Coba' }, create: { nama: 'Unit Uji Coba' }, update: {} })
    await prisma.unit.upsert({ where: { nama: 'Unit Uji Coba Kedua' }, create: { nama: 'Unit Uji Coba Kedua' }, update: {} })
    await buatStaf('admin.unit@contoh.test', 'Admin Unit (uji coba)', 'admin_unit', password, unit.id)
    await buatStaf('keuangan@contoh.test', 'Keuangan (uji coba)', 'keuangan', password)
    await buatStaf('inspektorat@contoh.test', 'Inspektorat (uji coba)', 'inspektorat', password)
    console.info('Data uji dibuat: Unit Uji Coba, admin.unit@, keuangan@, inspektorat@contoh.test (password sama dengan Super Admin)')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
