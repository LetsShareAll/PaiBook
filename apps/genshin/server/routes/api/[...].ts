import { toWebRequest } from 'h3'
import { createApiApp } from '@paibook/api'
import { createDb } from '@paibook/db'
import { gameIdSchema } from '@paibook/contracts'
import { useSiteEnv } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  const env = useSiteEnv(event)
  const game = gameIdSchema.safeParse(env.SITE_GAME)
  if (!game.success) {
    throw createError({ statusCode: 500, statusMessage: `未知的 SITE_GAME：${env.SITE_GAME}` })
  }

  const app = createApiApp({ db: createDb(env.DB), game: game.data })
  return app.fetch(toWebRequest(event))
})
