<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="p-6 sm:p-10 mx-auto">
    <RouterView />
  </main>
  <div class="min-h-10 " />
</template>
