/**
 * 站点挂载在前缀下（/genshin、/honkaistarrail、/zenlesszonezero），
 * NuxtLink 由 Vue Router 的 base 自动加前缀，但 $fetch / useFetch 的相对路径不会——
 * 所有 API 调用都必须经过这里。
 */
export function apiUrl(path: string): string {
  const base = useRuntimeConfig().app.baseURL || '/'
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`
}
