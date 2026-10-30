<template>
  <div class="flex min-h-dvh flex-col">
    <a href="#isi" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-tombol focus:bg-kanvas focus:px-4 focus:py-2">
      Lewati ke isi
    </a>
    <AppHeader />
    <main id="isi" class="flex-1">
      <slot />
    </main>
    <footer class="border-t border-garis">
      <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-sekunder sm:flex-row sm:justify-between">
        <span>Database Narasumber Kegiatan LAN</span>
        <span>Lembaga Administrasi Negara Republik Indonesia</span>
      </div>
    </footer>
  </div>
</template>
