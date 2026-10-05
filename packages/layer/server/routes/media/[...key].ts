import type { H3Event } from 'h3'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

/** 图片从 R2 直出：内容寻址的 key 不会变，所以可以长缓存 + immutable。 */
export default defineEventHandler(async (event: H3Event) => {
  const key = decodeURIComponent(String((event.context.params as { key?: string })?.key ?? ''))
  if (!key || key.includes('..')) throw createError({ statusCode: 404, message: 'Not found' })

  const media = (event.context as { cloudflare?: { env?: { MEDIA?: R2Bucket } } }).cloudflare?.env?.MEDIA
  if (!media) throw createError({ statusCode: 500, message: 'R2 绑定 MEDIA 不可用：检查 wrangler.jsonc' })

  const object = await media.get(key)
  if (!object) throw createError({ statusCode: 404, message: 'Not found' })

  const extension = key.split('.').pop() ?? ''
  return new Response(object.body, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? CONTENT_TYPES[extension] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      etag: object.httpEtag,
    },
  })
})
