import { toWebRequest } from 'h3'
import { createPortalApp } from '@paibook/api'
import { createDb } from '@paibook/db'
import { useSiteEnv } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  const env = useSiteEnv(event)
  const app = createPortalApp({ db: createDb(env.DB) })
  return app.fetch(toWebRequest(event))
})
