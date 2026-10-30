import { connect } from 'node:net'

// NFR-09: pindai unggahan lewat clamd (perintah INSTREAM) bila NUXT_CLAMAV_HOST diisi.
// Tanpa konfigurasi itu pemindaian dilewati. Bila clamd dikonfigurasi tapi tidak bisa dihubungi,
// unggahan ditolak (gagal tertutup), bukan diloloskan.
function kirimKeClamd(isi: Buffer, host: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const soket = connect(port, host)
    let jawaban = ''
    soket.setTimeout(20_000, () => soket.destroy(new Error('Waktu pemindaian habis')))
    soket.on('error', reject)
    soket.on('data', (d) => { jawaban += d.toString() })
    soket.on('close', () => resolve(jawaban))
    soket.on('connect', () => {
      soket.write('zINSTREAM\0')
      for (let i = 0; i < isi.length; i += 64 * 1024) {
        const potongan = isi.subarray(i, i + 64 * 1024)
        const panjang = Buffer.alloc(4)
        panjang.writeUInt32BE(potongan.length)
        soket.write(panjang)
        soket.write(potongan)
      }
      soket.end(Buffer.alloc(4))
    })
  })
}

export async function pindaiVirus(isi: Buffer) {
  const { clamavHost, clamavPort } = useRuntimeConfig()
  if (!clamavHost) return
  let jawaban: string
  try {
    jawaban = await kirimKeClamd(isi, clamavHost, Number(clamavPort) || 3310)
  }
  catch (e) {
    console.error('Pemindai antivirus gagal dihubungi:', (e as Error).message)
    throw createError({ statusCode: 503, message: 'Pemindai antivirus sedang tidak bisa dihubungi. Coba unggah lagi nanti.' })
  }
  if (!/:\s*OK\b/.test(jawaban)) {
    throw createError({ statusCode: 422, message: 'File ditolak karena terdeteksi berbahaya oleh pemindai antivirus.' })
  }
}
