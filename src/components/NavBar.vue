<script setup lang="ts">
import { reactive } from 'vue'
import IconGithub from './IconGithub.vue'
import IconTwitter from './IconTwitter.vue'
import IconMenu from './IconMenu.vue'

const state = reactive({ open: false })
const paths = ['/', '/portfolio', '/photos', '/posts']

function firstCharUpperCase(str: string) {
  if (str.length < 1) return
  return str[1].toUpperCase() + str.slice(2)
}

function toggleMenu() { state.open = !state.open }
</script>

<template>
  <nav class="relative">
    <!-- Navigation bar for mobile phone -->
    <div
      class="fixed top-0 left-0 bottom-0 right-0 bg-black opacity-0 pointer-events-none data-[open=true]:pointer-events-auto dark:data-[open=true]:opacity-40 data-[open=true]:opacity-10"
      :style="{ transition: 'all ease .3s' }"
      :data-open="state.open"
      @click="toggleMenu"
    />
    <div
      class="absolute top-full left-0 right-0 px-6 pt-2 pb-6 flex flex-col space-y-6 bg-[--bg]"
      :style="{
        opacity: state.open ? '1' : '0',
        transform: state.open ? 'translate3d(0, 0, 0)' : 'translate3d(0, -100%, 0)',
        transition: 'all ease .3s',
      }"
      @click="toggleMenu"
    >
      <RouterLink
        v-for="(path, index) in paths"
        :key="path"
        :style="{
          opacity: '0',
          animation: state.open ? 'nav-item-anim ease .16s forwards' : null,
          animationDelay: `${(index + 1.6) * 0.06}s`,
        }"
        :to="path"
      >
        {{ path === '/' ? 'Home' : firstCharUpperCase(path) }}
      </RouterLink>
    </div>

    <!-- Navigation bar for PC -->
    <div class="flex flex-row items-center px-4 py-4 sm:px-10 sm:py-8 bg-[--bg] relative z-10">
      <div class="block sm:hidden cursor-pointer " @click="toggleMenu">
        <IconMenu />
      </div>
      <div class="flex-1"></div>
      <div class="flex flex-row space-x-8 items-center font-sans uppercase">
        <RouterLink
          v-for="path in paths"
          :key="path"
          class="hidden sm:block hover:opacity-60 "
          :to="path"
        >
          {{ path === '/' ? 'Home' : firstCharUpperCase(path) }}
        </RouterLink>
        <a class="hover:opacity-60 " href="https://x.com/657KB" title="X / Twitter">
          <IconTwitter />
        </a>
        <a class="hover:opacity-60 " href="https://github.com/657kb" title="Github">
          <IconGithub />
        </a>
      </div>
    </div>
  </nav>

</template>

<style lang="css">
@keyframes nav-item-anim {
  from {
    opacity: 0;
    transform: translate3d(0, -10%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>