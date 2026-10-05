import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  css: [fileURLToPath(new URL('./app/assets/css/tokens.css', import.meta.url))],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
