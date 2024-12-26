<script setup lang="ts">
const props = defineProps<{ src: string }>()
const emits = defineEmits<{ load: [] }>()
</script>

<template>
  <div class="shadow-xl border overflow-hidden p-4 pb-16 bg-[#efefef]">
    <img
      class="object-cover w-full h-full"
      loading="lazy"
      :src="props.src"
      @load="() => emits('load')"
    />
  </div>
</template>