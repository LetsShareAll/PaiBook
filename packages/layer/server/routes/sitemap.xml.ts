import type { H3Event } from 'h3'
import { createDb, listPublishedGuides } from '@paibook/db'
import type { GameId } from '@paibook/contracts'

/**
 * 攻略站活路是被搜到，所以站点地图是必需品而不是可选项。
 * 游戏站列出全部已发布攻略；门厅列出三个入口。
 */
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.app.baseURL ?? '/')
  const siteUrl = String((config.public as { siteUrl?: string }).siteUrl ?? '').replace(/\/$/, '')
  const gameId = String((config.public as { siteGame?: string }).siteGame ?? '')

  const entries: { loc: string; lastmod?: string }[] = []
  const db = (event.context as { cloudflare?: { env?: { DB?: D1Database } } }).cloudflare?.env?.DB

  if (gameId && db) {
    entries.push({ loc: `${siteUrl}${base}` })
    const guides = await listPublishedGuides(createDb(db), gameId as GameId)
    for (const guide of guides) {
      entries.push({
        loc: `${siteUrl}${base}guides/${guide.slug}`,
        lastmod: guide.publishedAt ? guide.publishedAt.slice(0, 10) : undefined,
      })
    }
  } else {
    for (const path of ['/', '/genshin/', '/honkaistarrail/', '/zenlesszonezero/']) {
      entries.push({ loc: `${siteUrl}${path}` })
    }
  }

  const body = entries
    .map((entry) => `  <url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
})
