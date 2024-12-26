import { basename, resolve } from 'node:path'
import { readFileSync, readdirSync, lstatSync } from 'node:fs'
import { defineConfig } from 'vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { readingTime } from 'reading-time-estimator'
import vue from '@vitejs/plugin-vue'
import router from 'unplugin-vue-router/vite'
import components from 'unplugin-vue-components/vite'
import markdown from 'unplugin-vue-markdown/vite'
import markdownAnchor from 'markdown-it-anchor'
import markdownPrism from 'markdown-it-prism'
import prism from 'vite-plugin-prismjs'
import sitemap from 'vite-plugin-sitemap'
import matter from 'gray-matter'

const postRoutes = () => {
  const POSTS_DIR = resolve(__dirname, 'pages/posts')
  if (lstatSync(POSTS_DIR).isDirectory()) {
    return readdirSync(POSTS_DIR)
      .filter(file => file !== 'index.md')
      .map(file => `/posts/${file.replace('.md', '')}`)
  }
  return []
}

export default defineConfig({
  assetsInclude: ['**/*.JPG'],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    router({
      extensions: ['.vue', '.md'],
      routesFolder: 'pages',
      extendRoute(route) {
        const path = route.components.get('default')
        if (
          path
          && path.includes('/posts')
          && path.endsWith('.md')
          && !path.endsWith('/index.md')
        ) {
          const file = readFileSync(path, 'utf-8')
          const { data } = matter(file)
          data.readingTime = readingTime(file.toString())
          route.addToMeta({ frontmatter: data })
        }
        if (path && path.endsWith('/photos.md')) {
          const file = readFileSync(path, 'utf-8')
          const { data } = matter(file)
          route.addToMeta({ frontmatter: data })
        }
      },
    }),
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|webp)$/i, 
      png: {
        quality: 30,
        compressionLevel: 6,
      },
      jpeg: {
        quality: 30,
      },
      jpg: {
        quality: 30,
      },
      webp: {
        lossless: true,
      },
    }),
    components({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    }),
    prism({
      languages: ['javascript', 'css', 'html', 'typescript', 'dart', 'yaml', 'shell', 'cmake', 'c'],
      plugins: ['copy-to-clipboard'],
      theme: 'tomorrow',
      css: true,
    }),
    markdown({
      wrapperComponent: id => {
        return id.includes('/posts/') && !id.includes('/posts/index')
          ? 'WrapperPost'
          : id.includes('/photos')
            ? 'WrapperPhotos'
            : 'WrapperDefault'
      },
      frontmatterPreprocess: (frontmatter, options, id, defaults) => {
        (() => {
          if (!id.includes('/posts')) return
          if (basename(id, '.md') === 'index') return
          frontmatter.readingTime = readingTime(readFileSync(id).toString())
        })()
        return {
          head: defaults(frontmatter, options),
          frontmatter,
        }
      },
      async markdownItSetup(md) {
        md.use(markdownAnchor)
        md.use(markdownPrism)
      }
    }),
    sitemap({
      hostname: 'https://657.life',
      dynamicRoutes: [
        '/photos',
        '/portfolio',
        '/posts',
        ...postRoutes(),
      ],
    }),
  ],
})
