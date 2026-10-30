import nodemailer from 'nodemailer'

// Tanpa NUXT_SMTP_HOST (pengembangan), email dicetak ke konsol server.
export async function kirimEmail(ke: string, subjek: string, teks: string) {
  const c = useRuntimeConfig()
  if (!c.smtpHost) {
    console.info(`\n[EMAIL] Ke: ${ke}\nSubjek: ${subjek}\n\n${teks}\n`)
    return
  }
  const transport = nodemailer.createTransport({
    host: c.smtpHost,
    port: Number(c.smtpPort),
    secure: c.smtpPort === '465',
    auth: c.smtpUser ? { user: c.smtpUser, pass: c.smtpPass } : undefined,
  })
  await transport.sendMail({ from: c.smtpFrom, to: ke, subject: subjek, text: teks })
}

export function urlAplikasi(path: string) {
  return new URL(path, useRuntimeConfig().public.urlAplikasi).toString()
}

const PENUTUP = '\n\nEmail ini dikirim otomatis oleh aplikasi Database Narasumber Kegiatan LAN. Jangan membalas email ini.'

export const templatEmail = {
  undangan: (link: string, unit: string, kedaluwarsa: Date) => ({
    subjek: 'Undangan mengisi data narasumber kegiatan LAN',
    teks: `${unit} mengundang Anda mengisi data narasumber.\n\nBuka link berikut untuk mendaftar dan mengisi data:\n${link}\n\nLink berlaku sampai ${kedaluwarsa.toLocaleString('id-ID')} dan hanya bisa dipakai sekali.${PENUTUP}`,
  }),
  verifikasi: (link: string) => ({
    subjek: 'Verifikasi email Anda',
    teks: `Buka link berikut untuk memverifikasi email Anda:\n${link}\n\nLink berlaku 24 jam.${PENUTUP}`,
  }),
  reset: (link: string) => ({
    subjek: 'Atur ulang password',
    teks: `Buka link berikut untuk membuat password baru:\n${link}\n\nLink berlaku 1 jam dan hanya bisa dipakai sekali. Abaikan email ini jika Anda tidak memintanya.${PENUTUP}`,
  }),
  akunStaf: (link: string, role: string) => ({
    subjek: 'Akun Database Narasumber LAN untuk Anda',
    teks: `Super Admin membuatkan akun ${role} untuk Anda.\n\nBuat password Anda lewat link berikut:\n${link}\n\nLink berlaku 24 jam.${PENUTUP}`,
  }),
  disetujui: () => ({
    subjek: 'Data narasumber Anda disetujui',
    teks: `Admin kegiatan sudah memeriksa dan menyetujui data Anda. Anda tetap bisa memperbarui data kapan saja di ${urlAplikasi('/narasumber')}.${PENUTUP}`,
  }),
  perluPerbaikan: (catatan: string) => ({
    subjek: 'Data narasumber Anda perlu diperbaiki',
    teks: `Admin kegiatan meminta perbaikan data Anda dengan catatan:\n\n${catatan}\n\nPerbaiki data di ${urlAplikasi('/narasumber/isi')}.${PENUTUP}`,
  }),
  dataMasuk: (nama: string, id: number) => ({
    subjek: `Data narasumber ${nama} siap direview`,
    teks: `${nama} menyimpan atau memperbarui datanya. Periksa di ${urlAplikasi(`/admin/narasumber/${id}`)}.${PENUTUP}`,
  }),
}
