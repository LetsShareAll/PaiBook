import type { H3Event } from 'h3'

export default defineEventHandler((event: H3Event) => {
  const ctx = event.context as Record<string, unknown>
  const cloudflare = ctx.cloudflare as { env?: Record<string, unknown> } | undefined
  const env = cloudflare?.env

  return {
    contextKeys: Object.keys(ctx),
    cloudflareKeys: cloudflare ? Object.keys(cloudflare) : [],
    envType: typeof env,
    envOwnProps: env ? Object.getOwnPropertyNames(env) : [],
    hasDb: env ? 'DB' in env : false,
    dbType: env ? typeof env.DB : 'undefined',
    siteGame: env ? env.SITE_GAME : undefined,
    wranglerHome: process.env.WRANGLER_HOME ?? null,
    registryPath: process.env.MINIFLARE_REGISTRY_PATH ?? null,
  }
})
