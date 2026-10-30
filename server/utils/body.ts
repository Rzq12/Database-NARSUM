import type { H3Event } from 'h3'
import type { z } from 'zod'

// Pesan per kolom dikirim di data.galat supaya form bisa menaruhnya di bawah kolom yang salah.
export function galat422(galat: Record<string, string>, message = 'Periksa kembali isian yang ditandai.') {
  return createError({ statusCode: 422, message, data: { galat } })
}

export async function bacaBody<T extends z.ZodType>(event: H3Event, skema: T): Promise<z.output<T>> {
  const hasil = skema.safeParse(await readBody(event))
  if (!hasil.success) throw galat422(galatPerKolom(hasil.error))
  return hasil.data
}

export function idDariParam(event: H3Event, nama = 'id'): number {
  const id = Number(getRouterParam(event, nama))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 404, message: 'Data tidak ditemukan.' })
  return id
}
