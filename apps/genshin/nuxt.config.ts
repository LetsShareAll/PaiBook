export default defineNuxtConfig({
  extends: ['@paibook/layer'],
  compatibilityDate: '2026-10-05',
  nitro: {
    preset: 'cloudflare_module',
  },
  routeRules: {
    '/': { swr: 60 },
    '/guides/**': { swr: 60 },
  },
  app: {
    head: {
      htmlAttrs: { 'data-site': 'genshin' },
      title: 'PaiBook · 原神',
    },
  },
})
