import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      siteUrl: 'https://paibook.lssa.fun',
    },
  },
  // 基础安全响应头：四个站共用。CSP 暂时不加——Nuxt 有内联脚本，
  // 与其放一个会被随手放宽的假 CSP，不如先只做确定有效的那几条。
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'SAMEORIGIN',
        'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
      },
    },
  },
  css: [
    fileURLToPath(new URL('./app/assets/css/tokens.css', import.meta.url)),
    fileURLToPath(new URL('./app/assets/css/controls.css', import.meta.url)),
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
