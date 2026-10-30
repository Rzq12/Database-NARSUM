import type { H3Event } from 'h3'

const JENIS: JenisDokumen[] = ['npwp', 'buku_tabungan', 'cv']

export function jenisDariParam(event: H3Event): JenisDokumen {
  const jenis = getRouterParam(event, 'jenis') as JenisDokumen
  if (!JENIS.includes(jenis)) throw createError({ statusCode: 404, message: 'Jenis dokumen tidak dikenal.' })
  return jenis
}

export const SEMUA_JENIS_DOKUMEN = JENIS
