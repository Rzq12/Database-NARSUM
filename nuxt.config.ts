export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Database Narasumber Kegiatan LAN',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
      ],
      // Pasang tema sebelum render agar tidak berkedip.
      script: [{
        innerHTML: `try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
      }],
    },
  },

  runtimeConfig: {
    kunciEnkripsi: '',
    kunciIndeks: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    folderDokumen: '.data/dokumen',
    session: {
      // Batas mutlak cookie. Batas tidak aktif per role ada di server/middleware/sesi.ts.
      maxAge: 60 * 60 * 8,
    },
    public: {
      urlAplikasi: 'http://localhost:3000',
      myasnUrl: 'https://myasn.bkn.go.id',
    },
  },

  nitro: {
    experimental: { tasks: false },
  },
})
