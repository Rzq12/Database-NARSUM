import type { H3Event } from 'h3'
import { hash, verify } from '@node-rs/argon2'

// Role selalu dibaca ulang dari basis data, jadi perubahan role atau penonaktifan berlaku seketika.
export async function requireLogin(event: H3Event) {
  const { user } = await requireUserSession(event, { message: 'Sesi berakhir. Silakan masuk lagi.' })
  const akun = await prisma.user.findUnique({
    where: { id: user.id },
    include: { units: { include: { unit: true } } },
  })
  if (!akun || akun.status !== 'aktif') {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'Sesi berakhir. Silakan masuk lagi.' })
  }
  return akun
}

export type Akun = Awaited<ReturnType<typeof requireLogin>>

export async function requireRole(event: H3Event, ...roles: Role[]) {
  const akun = await requireLogin(event)
  if (!roles.includes(akun.role)) {
    throw createError({ statusCode: 403, message: 'Anda tidak punya akses untuk tindakan ini.' })
  }
  return akun
}

export function requireFitur(event: H3Event, fitur: Fitur) {
  return requireRole(event, ...AKSES[fitur])
}

export function unitIds(akun: Akun): number[] {
  return akun.units.map(u => u.unit_id)
}

// Nama berbeda dari hashPassword bawaan nuxt-auth-utils (scrypt); NFR-02 meminta argon2id.
export function buatHashPassword(password: string) {
  return hash(password, { algorithm: 2 }) // argon2id
}

export function cocokPassword(hashTersimpan: string, password: string) {
  return verify(hashTersimpan, password)
}
