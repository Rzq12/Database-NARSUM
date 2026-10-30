import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const global = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = global.prisma
  ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

if (import.meta.dev) global.prisma = prisma
