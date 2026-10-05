import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { guideWriteSchema, linkWriteSchema, loginSchema } from '@paibook/contracts'
import {
  createGuide,
  createLink,
  deleteLink,
  getGuideForAdmin,
  listGuidesForAdmin,
  listLinks,
  listTaxonomy,
  reindexGuideSearch,
  setGuideStatus,
  syncGuideSearch,
  updateGuide,
} from '@paibook/db'
import type { ApiContext } from './app.ts'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from './auth.ts'

export function createAdminApp(ctx: ApiContext) {
  const app = new Hono()

  app.post('/login', async (c) => {
    const parsed = loginSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success || !(await passwordMatches(ctx.env.ADMIN_PASSWORD ?? '', parsed.data.password))) {
      return c.json({ error: 'invalid_credentials' }, 401)
    }

    setCookie(c, SESSION_COOKIE, await createSessionToken(ctx.env.SESSION_SECRET ?? ''), {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: ctx.secureCookies,
      maxAge: SESSION_TTL_SECONDS,
    })
    return c.json({ ok: true })
  })

  app.post('/logout', (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })

  app.use('*', createMiddleware(async (c, next) => {
    const authorized = await verifySessionToken(ctx.env.SESSION_SECRET ?? '', getCookie(c, SESSION_COOKIE))
    if (!authorized) return c.json({ error: 'unauthorized' }, 401)
    await next()
  }))

  app.get('/session', (c) => c.json({ ok: true }))

  app.get('/taxonomy', async (c) => c.json(await listTaxonomy(ctx.db, ctx.game)))

  app.get('/guides', async (c) => c.json({ items: await listGuidesForAdmin(ctx.db, ctx.game) }))

  app.post('/guides', async (c) => {
    const parsed = guideWriteSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_payload', issues: parsed.error.issues }, 400)

    const id = await createGuide(ctx.db, ctx.game, parsed.data)
    await syncGuideSearch(ctx.db, id)
    return c.json({ id }, 201)
  })

  app.get('/guides/:id', async (c) => {
    const guide = await getGuideForAdmin(ctx.db, ctx.game, c.req.param('id'))
    if (!guide) return c.json({ error: 'not_found' }, 404)
    return c.json(guide)
  })

  app.put('/guides/:id', async (c) => {
    const parsed = guideWriteSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_payload', issues: parsed.error.issues }, 400)

    const id = c.req.param('id')
    const existing = await getGuideForAdmin(ctx.db, ctx.game, id)
    if (!existing) return c.json({ error: 'not_found' }, 404)

    await updateGuide(ctx.db, id, parsed.data)
    await syncGuideSearch(ctx.db, id)
    return c.json({ ok: true })
  })

  /** 重建本站搜索索引（首次建表或改了分词规则时用）。 */
  app.post('/reindex', async (c) => c.json({ count: await reindexGuideSearch(ctx.db, ctx.game) }))

  app.get('/links', async (c) => c.json({ items: await listLinks(ctx.db, ctx.game) }))

  app.post('/links', async (c) => {
    const parsed = linkWriteSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'invalid_payload', issues: parsed.error.issues }, 400)

    const id = await createLink(ctx.db, ctx.game, parsed.data)
    await ctx.onContentChanged?.({ slug: '', status: 'published' })
    return c.json({ id }, 201)
  })

  app.delete('/links/:id', async (c) => {
    const removed = await deleteLink(ctx.db, ctx.game, c.req.param('id'))
    if (!removed) return c.json({ error: 'not_found' }, 404)

    await ctx.onContentChanged?.({ slug: '', status: 'published' })
    return c.json({ ok: true })
  })

  app.post('/guides/:id/status', async (c) => {
    const body = (await c.req.json().catch(() => null)) as { status?: string } | null
    if (body?.status !== 'draft' && body?.status !== 'published') {
      return c.json({ error: 'invalid_status' }, 400)
    }

    const result = await setGuideStatus(ctx.db, c.req.param('id'), body.status)
    if (!result) return c.json({ error: 'not_found' }, 404)

    await ctx.onContentChanged?.({ slug: result.slug, status: result.status })
    return c.json(result)
  })

  return app
}
