<script setup lang="ts">
const { loggedIn, user } = useUserSession()
await navigateTo(loggedIn.value && user.value ? berandaRole(user.value.role) : '/login', { replace: true })
</script>

<template>
  <div />
</template>
