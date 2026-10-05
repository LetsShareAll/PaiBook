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

  const request = toWebRequest(event)

  const app = createApiApp({
    db: createDb(env.DB),
    game: game.data,
    env: { ADMIN_PASSWORD: env.ADMIN_PASSWORD, SESSION_SECRET: env.SESSION_SECRET },
    secureCookies: new URL(request.url).protocol === 'https:',
    onContentChanged: async ({ slug }) => {
      const cleared = await purgeContentPaths(slug)
      console.log(`[purge] ${slug}: 已清除 ${cleared} 条缓存`)
    },
  })

  return app.fetch(request)
})
