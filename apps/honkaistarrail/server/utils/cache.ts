/**
 * 发布后清掉受影响的边缘缓存路径（ADR-0002）。
 * 缓存里存的是这些 URL 的渲染结果或 API JSON，删除即可让下次请求回源。
 */
export async function purgeContentPaths(origin: string, slug: string): Promise<string[]> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  if (!cache) return []

  const paths = ['/', `/guides/${slug}`, '/api/guides', `/api/guides/${slug}`]
  const deleted: string[] = []

  await Promise.all(
    paths.map(async (path) => {
      const url = new URL(path, origin).toString()
      if (await cache.delete(new Request(url))) deleted.push(url)
    }),
  )

  return deleted
}
