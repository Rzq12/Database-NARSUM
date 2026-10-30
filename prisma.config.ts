import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// process.env, bukan env() dari prisma/config: env() gagal bila DATABASE_URL kosong, padahal
// `prisma generate` (postinstall, termasuk saat build di CI/Vercel) tidak butuh koneksi basis data.
// Perintah yang memang butuh basis data (migrate, seed) tetap gagal dengan pesan jelas bila kosong.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
