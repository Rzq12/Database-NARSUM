import type { H3Event } from 'h3'

export function jenisDariParam(event: H3Event): JenisDokumen {
  const jenis = getRouterParam(event, 'jenis') as JenisDokumen
  if (!JENIS_DOKUMEN.includes(jenis)) throw createError({ statusCode: 404, message: 'Jenis dokumen tidak dikenal.' })
  return jenis
}
