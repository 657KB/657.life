<script setup lang="ts">
import { titleWithSuffix } from '@/utils'
import { useRouter } from 'vue-router/auto'

const router = useRouter()
const path = router.currentRoute.value.path
document.title = path === '/'
  ? `657's Life`
  : titleWithSuffix(path.slice(1).toUpperCase())
</script>
<template>
  <div class="max-w-[680px] mx-auto">
    <slot></slot>
  </div>
</template>