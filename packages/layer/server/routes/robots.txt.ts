/**
 * 放在共享层里：四个站共用一份规则。
 * 后台与档案页不该被抓取（档案页本身也带了 noindex）。
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.app.baseURL ?? '/')
  const siteUrl = String((config.public as { siteUrl?: string }).siteUrl ?? '').replace(/\/$/, '')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /profile', `Sitemap: ${siteUrl}${base}sitemap.xml`, ''].join(
    '\n',
  )
})
