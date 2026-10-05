/**
 * 发布后清缓存（ADR-0002）。
 *
 * 实测发现：route rules 的 swr 缓存由 Nitro 自己的 storage 承载，
 * 直接删 `caches.default` 里的 URL 是清不掉的——所以这里清 Nitro 的 cache storage。
 * 站点规模很小、发布频率很低，整表清空的代价可以忽略；换来的是「发布即生效」这件事不依赖键名推导。
 */
export async function purgeContentPaths(slug: string): Promise<number> {
  let cleared = 0

  try {
    const storage = useStorage('cache')
    const keys = await storage.getKeys()
    for (const key of keys) {
      await storage.removeItem(key)
      cleared += 1
    }
  } catch (error) {
    console.warn('[purge] Nitro cache storage 不可用：', String(error))
  }

  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  if (cache) {
    for (const path of ['/', `/guides/${slug}`, '/api/guides', `/api/guides/${slug}`]) {
      if (await cache.delete(new Request(`https://paibook.local${path}`))) cleared += 1
    }
  }

  return cleared
}
