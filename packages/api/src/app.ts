import { Hono } from 'hono'
import type { GameId } from '@paibook/contracts'
import type { Db } from '@paibook/db'
import { getPublishedGuide, listPublishedGuides } from '@paibook/db'
import { createAdminApp } from './admin.ts'

export interface ApiEnv {
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
}

export interface ApiContext {
  db: Db
  game: GameId
  env: ApiEnv
  secureCookies: boolean
  /** 内容状态变化后的副作用（如边缘缓存 purge）。 */
  onContentChanged?: (change: { slug: string; status: 'draft' | 'published' }) => Promise<void>
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

  app.route('/admin', createAdminApp(ctx))

  return app
}
