<script setup lang="ts">
import dayjs from 'dayjs'

import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

const { frontmatter } = defineProps({
  frontmatter: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class=" max-w-[80ch] mx-auto ">
    <h1 class=" text-4xl font-bold mb-2">{{ frontmatter.title }}</h1>
    <p class=" mb-6 text-[#888] font-mono ">
      <span>{{ dayjs(frontmatter.date).format('DD MMM YYYY') }}</span>
      <span class> / </span>
      <span>{{ frontmatter.readingTime.text }}</span>
    </p>
    <slot></slot>
  </div>
</template>