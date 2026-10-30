import { describe, expect, it } from 'vitest'
import { cekBatas } from '../server/utils/batas'

describe('cekBatas (pembatas permintaan per IP)', () => {
  it('mengizinkan sampai batas lalu menolak di dalam jendela', () => {
    const t = 1_000_000
    const hasil = Array.from({ length: 4 }, (_, i) => cekBatas('uji-a', 3, 60_000, t + i).boleh)
    expect(hasil).toEqual([true, true, true, false])
  })

  it('memberi tahu berapa detik harus menunggu', () => {
    const t = 2_000_000
    for (let i = 0; i < 2; i++) cekBatas('uji-b', 2, 60_000, t)
    expect(cekBatas('uji-b', 2, 60_000, t + 10_000).tungguDetik).toBe(50)
  })

  it('mengizinkan lagi setelah jendela lewat', () => {
    const t = 3_000_000
    for (let i = 0; i < 2; i++) cekBatas('uji-c', 2, 60_000, t)
    expect(cekBatas('uji-c', 2, 60_000, t + 60_001).boleh).toBe(true)
  })

  it('memisahkan hitungan per kunci', () => {
    const t = 4_000_000
    cekBatas('uji-d', 1, 60_000, t)
    expect(cekBatas('uji-e', 1, 60_000, t).boleh).toBe(true)
  })
})
