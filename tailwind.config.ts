import type { Config } from 'tailwindcss'

// Warna diambil dari notion-DESIGN.md dan dipetakan ke variabel CSS di assets/css/main.css
// supaya mode terang dan gelap memakai token yang sama.
export default {
  content: ['./app/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        kanvas: 'var(--kanvas)',
        permukaan: 'var(--permukaan)',
        garis: 'var(--garis)',
        'garis-kuat': 'var(--garis-kuat)',
        tinta: 'var(--tinta)',
        arang: 'var(--arang)',
        sekunder: 'var(--sekunder)',
        utama: 'var(--utama)',
        'utama-tekan': 'var(--utama-tekan)',
        tautan: 'var(--tautan)',
        navy: 'var(--navy)',
        'navy-teks': 'var(--navy-teks)',
        'navy-redup': 'var(--navy-redup)',
        galat: 'var(--galat)',
        'galat-latar': 'var(--galat-latar)',
        'st-draf': 'var(--st-draf)',
        'st-draf-teks': 'var(--st-draf-teks)',
        'st-menunggu': 'var(--st-menunggu)',
        'st-menunggu-teks': 'var(--st-menunggu-teks)',
        'st-setuju': 'var(--st-setuju)',
        'st-setuju-teks': 'var(--st-setuju-teks)',
        'st-perbaikan': 'var(--st-perbaikan)',
        'st-perbaikan-teks': 'var(--st-perbaikan-teks)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        tombol: '8px',
        kartu: '12px',
        chip: '6px',
      },
    },
  },
} satisfies Config
