import { Hono } from 'hono'
import { gameCatalog } from '@paibook/contracts'
import type { Db } from '@paibook/db'
import { listRecentGuides } from '@paibook/db'

export interface PortalContext {
  db: Db
}

/** 门厅 API：游戏清单 + 跨游戏最近更新。 */
export function createPortalApp(ctx: PortalContext) {
  const app = new Hono().basePath('/api')

  app.get('/games', (c) =>
    c.json({
      items: Object.entries(gameCatalog).map(([id, entry]) => ({
        id,
        titleZh: entry.titleZh,
        titleEn: entry.titleEn,
        tagline: entry.tagline,
        href: `/${id}`,
      })),
    }),
  )

  app.get('/recent', async (c) => {
    const items = await listRecentGuides(ctx.db, 12)
    return c.json({ items, total: items.length })
  })

  return app
}
