<script setup lang="ts">
import { useRouter } from 'vue-router/auto'
import { computed, reactive } from 'vue'
import dayjs from 'dayjs'

const router = useRouter()
const routes = router.getRoutes().filter(route => {
  return route.path.startsWith('/posts')
    && route.path !== '/posts'
    && !route.meta.frontmatter.drafts
})

const tags = reactive({ value: new Map<string, boolean>() })

const noSelectedTags = computed(() => {
  return Array.from(tags.value.values()).every(selected => !selected)
})

const posts = computed(() => routes.map(route => {
  return {
    path: route.path,
    title: (route.meta.frontmatter.title || 'UNTITLED') as string,
    date: route.meta.frontmatter.date || 0,
    tags: (route.meta.frontmatter.tags || []) as string[],
    readingTime: (route.meta.frontmatter.readingTime?.text || '') as string,
  }
}).sort(({ date: d0 }, { date: d1 }) => d1 - d0))

function toggleTag(tag: string) {
  if (tags.value.has(tag)) {
    tags.value.set(tag, !tags.value.get(tag))
  }
}

function initTags() {
  const allTags = routes.reduce((acc, cur) => {
    acc.push(...(cur.meta.frontmatter.tags || []))
    return acc
  }, [] as string[])
  const deduplicatedTags = new Set(allTags)
  deduplicatedTags.forEach(tag => tags.value.set(tag, false))
}

function isVisible(postTags: string[]) {
  return postTags.some(tag => tags.value.get(tag))
}

initTags()
</script>

<template>
  <div class="flex flex-wrap mb-6">
    <span v-for="[tag, selected] in tags.value"
      class="py-1 me-4 border-dashed border border-[transparent] hover:opacity-60 data-[selected=true]:border-[--text-primary] data-[selected=true]:p-1 data-[selected=true]:opacity-100 text-base cursor-pointer select-none rounded"
      :data-selected="selected"
      @click="() => toggleTag(tag)"
    >
      # {{ tag }}
    </span>
  </div>
  <ul class="space-y-4 " :style="{ paddingLeft: 'unset' }">
    <li v-for="post in posts" :style="{ display: noSelectedTags || isVisible(post.tags) ? 'block' : 'none' }">
      <RouterLink :style="{ color: 'inherit' }" :to="post.path">
        {{ post.title }}
      </RouterLink>
      <br class="sm:hidden" />
      <div class="inline text-sm text-[#888] font-mono select-none w-fit sm:ms-4">
        <span>{{ dayjs(post.date).format('DD MMM YYYY') }}</span>
        <span class> / </span>
        <span>{{ post.readingTime }}</span>
      </div>
    </li>
  </ul>
</template>
