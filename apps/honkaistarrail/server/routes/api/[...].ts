import { toWebRequest } from 'h3'
import { createApiApp } from '@paibook/api'
import { createDb } from '@paibook/db'
import { gameIdSchema } from '@paibook/contracts'
import { useSiteEnv } from '../../utils/cloudflare'
import { purgeContentPaths } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const env = useSiteEnv(event)
  const game = gameIdSchema.safeParse(env.SITE_GAME)
  if (!game.success) {
    throw createError({ statusCode: 500, message: `未知的 SITE_GAME：${env.SITE_GAME}` })
  }

  // 站点挂在前缀下（/genshin/...），但 Hono 的 basePath 是 '/api'：
  // 交给 Hono 之前先把站点前缀剥掉，否则永远 404。
  const request = toWebRequest(event)
  const url = new URL(request.url)
  const prefix = `/${game.data}`
  if (url.pathname === prefix) {
    url.pathname = '/'
  } else if (url.pathname.startsWith(`${prefix}/`)) {
    url.pathname = url.pathname.slice(prefix.length)
  }

  const app = createApiApp({
    db: createDb(env.DB),
    game: game.data,
    env: { ADMIN_PASSWORD: env.ADMIN_PASSWORD, SESSION_SECRET: env.SESSION_SECRET },
    secureCookies: url.protocol === 'https:',
    onContentChanged: async ({ slug }) => {
      const cleared = await purgeContentPaths(slug)
      console.log(`[purge] ${slug}: 已清除 ${cleared} 条缓存`)
    },
  })

  return app.fetch(new Request(url.toString(), request))
})
