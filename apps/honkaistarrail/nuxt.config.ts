export default defineNuxtConfig({
  extends: ['@paibook/layer'],
  compatibilityDate: '2026-10-05',
  nitro: {
    preset: 'cloudflare_module',
  },
  // 开发环境不启用 SWR：否则改完代码/内容会看到旧 HTML。生产环境靠发布时 purge。
  routeRules: process.env.NODE_ENV === "production"
    ? {
      '/': { swr: 60 },
      '/guides/**': { swr: 60 },
      }
    : {},
  app: {
    head: {
      htmlAttrs: { 'data-site': 'honkaistarrail' },
      title: 'PaiBook · 崩坏：星穹铁道',
    },
  },
})
