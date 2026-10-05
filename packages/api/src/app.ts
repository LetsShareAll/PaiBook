import { Hono } from 'hono'
import type { GameId } from '@paibook/contracts'
import type { Db } from '@paibook/db'
import { getPublishedGuide, listPublishedGuides } from '@paibook/db'

export interface ApiContext {
  db: Db
  game: GameId
}

export function createApiApp(ctx: ApiContext) {
  const app = new Hono().basePath('/api')

  app.get('/health', (c) => c.json({ ok: true, game: ctx.game }))

  app.get('/guides', async (c) => {
    const items = await listPublishedGuides(ctx.db, ctx.game)
    return c.json({ items, total: items.length })
  })

  app.get('/guides/:slug', async (c) => {
    const guide = await getPublishedGuide(ctx.db, ctx.game, c.req.param('slug'))
    if (!guide) return c.json({ error: 'not_found' }, 404)
    return c.json(guide)
  })

  return app
}
