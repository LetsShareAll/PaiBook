export default defineNuxtConfig({
  extends: ['@paibook/layer'],
  compatibilityDate: '2026-10-05',
  app: {
    head: {
      htmlAttrs: { 'data-site': 'genshin' },
      title: 'PaiBook · 原神',
    },
  },
})
