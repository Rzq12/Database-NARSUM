<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const route = useRoute()
const menuTerbuka = ref(false)

const tautan = computed(() => {
  const role = user.value?.role
  if (!role) return []
  if (role === 'narasumber') {
    return [
      { ke: '/narasumber', label: 'Data saya' },
      { ke: '/narasumber/kegiatan', label: 'Riwayat kegiatan' },
      { ke: '/akun', label: 'Akun' },
    ]
  }
  return [
    { ke: '/admin', label: 'Narasumber', tampil: boleh(role, 'lihat_daftar') },
    { ke: '/admin/undangan', label: 'Undangan', tampil: boleh(role, 'buat_undangan') },
    { ke: '/admin/pendaftaran', label: 'Pendaftaran', tampil: boleh(role, 'setujui_pendaftaran') },
    { ke: '/admin/log', label: 'Log audit', tampil: boleh(role, 'log_audit') },
    { ke: '/admin/pengguna', label: 'Pengguna & unit', tampil: boleh(role, 'kelola_pengguna') },
    { ke: '/akun', label: 'Akun' },
  ].filter(t => t.tampil !== false)
})

function aktif(ke: string) {
  if (ke === '/admin') return route.path === '/admin' || route.path.startsWith('/admin/narasumber')
  if (ke === '/narasumber') return route.path === '/narasumber' || route.path === '/narasumber/isi'
  return route.path.startsWith(ke)
}

watch(() => route.fullPath, () => { menuTerbuka.value = false })

async function keluar() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <header class="bg-navy text-navy-teks">
    <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
      <NuxtLink to="/" class="flex min-w-0 items-center gap-3 rounded-tombol">
        <LogoLan />
        <span class="min-w-0 leading-tight">
          <span class="block truncate text-[15px] font-semibold">Database Narasumber</span>
          <span class="block truncate text-xs text-navy-redup">Kegiatan Lembaga Administrasi Negara</span>
        </span>
      </NuxtLink>

      <div class="ml-auto flex items-center gap-2">
        <TemaToggle class="hidden sm:inline-flex" />
        <button
          v-if="loggedIn"
          type="button"
          class="tombol border border-navy-redup/60 text-navy-teks hover:bg-white/10 lg:hidden"
          :aria-expanded="menuTerbuka"
          aria-controls="menu-utama"
          @click="menuTerbuka = !menuTerbuka"
        >
          {{ menuTerbuka ? 'Tutup menu' : 'Menu' }}
        </button>
      </div>
    </div>

    <nav
      v-if="loggedIn"
      id="menu-utama"
      aria-label="Menu utama"
      class="border-t border-white/10"
      :class="menuTerbuka ? 'block' : 'hidden lg:block'"
    >
      <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 lg:flex-row lg:items-center lg:gap-1">
        <NuxtLink
          v-for="t in tautan"
          :key="t.ke"
          :to="t.ke"
          class="flex min-h-[44px] items-center rounded-chip px-3 text-sm font-medium"
          :class="aktif(t.ke) ? 'bg-white text-navy' : 'text-navy-teks hover:bg-white/10'"
          :aria-current="aktif(t.ke) ? 'page' : undefined"
        >
          {{ t.label }}
        </NuxtLink>
        <div class="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3 lg:ml-auto lg:mt-0 lg:flex-row lg:items-center lg:border-0 lg:pt-0">
          <span class="text-sm text-navy-redup">
            {{ user?.nama }} · {{ user ? LABEL_ROLE[user.role] : '' }}
          </span>
          <div class="flex gap-2">
            <TemaToggle class="sm:hidden" />
            <button type="button" class="tombol border border-navy-redup/60 text-navy-teks hover:bg-white/10" @click="keluar">
              Keluar
            </button>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
