<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute } from 'vue-router/auto'
import PhotoCard from './PhotoCard.vue'

const route = useRoute()
const state = reactive({ itemWidth: 0 })
const photos = computed(() => route.meta.frontmatter.photos as string[])

function resize() {
  const gridWidth = document.querySelector('.masonry')?.getBoundingClientRect().width || 0
  if (screen.availWidth < 400) {
    state.itemWidth = gridWidth
  } else {
    state.itemWidth = (gridWidth - 16 - 10) / 2
  }
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <masonry-wall class="masonry mt-16 " :items="photos" :column-width="state.itemWidth" :min-columns="1" :max-columns="5"
    :gap="16">
    <template #default="{ item: url }">
      <PhotoCard :src="`${url}`" :style="{ width: `${state.itemWidth}px` }" />
    </template>
  </masonry-wall>
</template>