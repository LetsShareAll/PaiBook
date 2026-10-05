export default defineNuxtConfig({
  extends: ['@paibook/layer'],
  compatibilityDate: '2026-10-05',
  nitro: {
    preset: 'cloudflare_module',
  },
  app: {
    head: {
      htmlAttrs: { 'data-site': 'genshin' },
      title: 'PaiBook · 原神',
    },
  },
})
