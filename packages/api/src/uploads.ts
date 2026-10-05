/**
 * 图片上传（ADR-0003 里的 R2）。
 * 只允许位图，不接收 SVG —— SVG 可以带脚本，作为同源内容返回会成为 XSS 载体。
 */
import { Hono } from 'hono'
import type { ApiContext } from './app.ts'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createUploadApp(ctx: ApiContext) {
  const app = new Hono()

  app.post('/', async (c) => {
    if (!ctx.media) return c.json({ error: 'media_binding_missing' }, 500)

    const form = await c.req.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) return c.json({ error: 'missing_file' }, 400)

    const extension = ALLOWED[file.type]
    if (!extension) return c.json({ error: 'unsupported_type', allowed: Object.keys(ALLOWED) }, 415)
    if (file.size === 0) return c.json({ error: 'empty_file' }, 400)
    if (file.size > MAX_BYTES) return c.json({ error: 'too_large', maxBytes: MAX_BYTES }, 413)

    const bytes = new Uint8Array(await file.arrayBuffer())
    const hash = await sha256Hex(bytes)
    const key = `${ctx.game}/${hash.slice(0, 2)}/${hash}.${extension}`

    // 内容寻址：同一张图重复上传不会产生新对象。
    await ctx.media.put(key, bytes, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    })

    return c.json({ key, url: `${ctx.basePath}/media/${key}`, size: file.size, type: file.type }, 201)
  })

  return app
}
