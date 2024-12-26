import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import MasonryWall from '@yeger/vue-masonry-wall'
import Nprogress from 'nprogress'
import App from '@/App.vue'

import 'nprogress/nprogress.css'
import 'github-markdown-css/github-markdown.css'
import '@/styles/main.css'
import '@/styles/markdown.css'
import '@/styles/tailwind.css'

export const createApp = ViteSSG(App, { routes }, ({ app, router, isClient }) => {
  app.use(MasonryWall)

  if (isClient) {
    router.beforeEach(() => { Nprogress.start() })
    router.afterEach(() => { Nprogress.done() })
  }
})

