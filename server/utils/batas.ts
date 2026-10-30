import type { H3Event } from 'h3'

// Pembatas jendela geser di memori. Cukup untuk satu instance server;
// bila aplikasi dijalankan lebih dari satu instance, pindahkan penyimpanan ke Redis.
const catatan = new Map<string, number[]>()
const BATAS_KUNCI = 50_000

export function cekBatas(kunci: string, maks: number, jendelaMs: number, sekarang = Date.now()) {
  const awal = sekarang - jendelaMs
  const waktu = (catatan.get(kunci) ?? []).filter(t => t > awal)
  if (waktu.length >= maks) {
    catatan.set(kunci, waktu)
    return { boleh: false, tungguDetik: Math.ceil((waktu[0]! + jendelaMs - sekarang) / 1000) }
  }
  waktu.push(sekarang)
  catatan.set(kunci, waktu)
  if (catatan.size > BATAS_KUNCI) bersihkan(sekarang - 24 * 60 * 60_000)
  return { boleh: true, tungguDetik: 0 }
}

function bersihkan(sebelum: number) {
  for (const [kunci, waktu] of catatan) {
    if ((waktu.at(-1) ?? 0) < sebelum) catatan.delete(kunci)
  }
}

export function batasiPermintaan(event: H3Event, nama: string, maks: number, jendelaMs: number) {
  const { boleh, tungguDetik } = cekBatas(`${nama}:${ipKlien(event)}`, maks, jendelaMs)
  if (!boleh) {
    setResponseHeader(event, 'Retry-After', tungguDetik)
    throw createError({ statusCode: 429, message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(tungguDetik / 60)} menit.` })
  }
}
