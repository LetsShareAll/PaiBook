import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/fonts'],
  css: [fileURLToPath(new URL('./app/assets/css/tokens.css', import.meta.url))],
  fonts: {
    processCSSVariables: true,
    families: [
      { name: 'Noto Sans SC', provider: 'google', weights: [400, 500, 700] },
      { name: 'Noto Serif SC', provider: 'google', weights: [600, 700] },
    ],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
