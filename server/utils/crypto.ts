import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'

function kunci(nama: 'kunciEnkripsi' | 'kunciIndeks'): Buffer {
  const nilai = useRuntimeConfig()[nama]
  if (!/^[0-9a-f]{64}$/i.test(nilai)) {
    throw new Error(`${nama} belum diatur: isi NUXT_${nama === 'kunciEnkripsi' ? 'KUNCI_ENKRIPSI' : 'KUNCI_INDEKS'} dengan 64 karakter hex`)
  }
  return Buffer.from(nilai, 'hex')
}

// AES-256-GCM. Format simpan: v1:<iv>:<tag>:<data>, semuanya base64.
export function enkripsi(teks: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', kunci('kunciEnkripsi'), iv)
  const data = Buffer.concat([cipher.update(teks, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':')
}

export function dekripsi(simpan: string): string {
  const [versi, iv, tag, data] = simpan.split(':')
  if (versi !== 'v1' || !iv || !tag || !data) throw new Error('Format data terenkripsi tidak dikenal')
  const decipher = createDecipheriv('aes-256-gcm', kunci('kunciEnkripsi'), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
}

export function enkripsiAtauNull(teks: string | null | undefined): string | null {
  return teks ? enkripsi(teks) : null
}

export function dekripsiAtauNull(simpan: string | null | undefined): string | null {
  return simpan ? dekripsi(simpan) : null
}

// Indeks buta untuk menjaga NIK tetap unik tanpa menyimpan NIK dalam bentuk terbuka.
export function indeksNik(nik: string): string {
  return createHmac('sha256', kunci('kunciIndeks')).update(nik).digest('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function buatToken(): { token: string, hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function samarkan(nilai: string | null, terlihat = 4): string | null {
  if (!nilai) return null
  if (nilai.length <= terlihat) return '*'.repeat(nilai.length)
  return '*'.repeat(nilai.length - terlihat) + nilai.slice(-terlihat)
}
