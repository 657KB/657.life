<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const props = defineProps<{ src: string }>()
const emits = defineEmits<{ load: [] }>()

const isLoading = ref(true)
const isClicked = ref(false)
const imageLoaded = ref(false)

const handleLoad = () => {
  isLoading.value = false
  imageLoaded.value = true
  emits('load')
}

const toggleClicked = () => {
  isClicked.value = !isClicked.value
  if (isClicked.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="relative">
    <div class="shadow-xl border overflow-hidden p-4 pb-16 bg-[#efefef] transition-all duration-300"
      :class="{ 'cursor-pointer': !isLoading }" @click="!isLoading && toggleClicked()">
      <div v-if="isLoading" class="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
      <img class="object-cover w-full" loading="lazy" :src="props.src" @load="handleLoad" />
    </div>

    <!-- Zoom overlay -->
    <Transition name="fade">
      <div v-if="isClicked" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" @click="toggleClicked">
        <div class="relative max-w-[90vw] max-h-[90vh]">
          <img :src="props.src" class="max-w-full max-h-[90vh] object-contain" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>