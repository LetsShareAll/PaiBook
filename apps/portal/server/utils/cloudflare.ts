import type { H3Event } from 'h3'

export interface SiteEnv {
  DB: D1Database
  MEDIA?: R2Bucket
  SITE_GAME?: string
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
}

export function useSiteEnv(event: H3Event): SiteEnv {
  const env = (event.context as { cloudflare?: { env?: SiteEnv } }).cloudflare?.env
  if (!env?.DB) {
    throw createError({
      statusCode: 500,
      message: 'D1 绑定 DB 不可用：检查 wrangler.jsonc 与本地 .wrangler/state',
    })
  }
  return env
}
