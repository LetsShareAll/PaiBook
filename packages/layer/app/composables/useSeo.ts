/**
 * 分享卡片与基础 SEO。三站 + 门厅共用；图片是自绘的 og.png（ADR-0007）。
 */
import { gameCatalog, type GameId } from '@paibook/contracts'

function siteContext() {
  const config = useRuntimeConfig()
  const base = String(config.app.baseURL ?? '/')
  const siteUrl = String((config.public as { siteUrl?: string }).siteUrl ?? '').replace(/\/$/, '')
  const game = String((config.public as { siteGame?: string }).siteGame ?? '')
  return { base, siteUrl, game, url: `${siteUrl}${base}` }
}

export function useSiteSeo() {
  const { base, siteUrl, game, url } = siteContext()
  const entry = game ? gameCatalog[game as GameId] : undefined

  const title = entry ? `${entry.titleZh}攻略 · PaiBook 派书` : 'PaiBook · 派书'
  const description = entry
    ? `${entry.titleZh}（${entry.titleEn}）攻略：${entry.tagline}。不是应急食品，是应急手册！`
    : '《原神》《崩坏：星穹铁道》《绝区零》的攻略站。不是应急食品，是应急手册！'

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogType: 'website',
    ogSiteName: 'PaiBook · 派书',
    ogLocale: 'zh_CN',
    ogImage: `${siteUrl}${base}og.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
  })
}

export function useGuideSeo(guide: { title: string; summary: string; slug: string; publishedAt: string | null }) {
  const { base, siteUrl } = siteContext()
  const url = `${siteUrl}${base}guides/${guide.slug}`

  useSeoMeta({
    title: `${guide.title} · PaiBook`,
    description: guide.summary,
    ogTitle: guide.title,
    ogDescription: guide.summary,
    ogUrl: url,
    ogType: 'article',
    ogSiteName: 'PaiBook · 派书',
    ogLocale: 'zh_CN',
    ogImage: `${siteUrl}${base}og.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    articlePublishedTime: guide.publishedAt ?? undefined,
  })
}

/** 站点品牌信息：header 标题、标语、页脚里的游戏名与（星铁必需的）署名句。 */
export function useSiteBranding() {
  const { game } = siteContext()
  const entry = game ? gameCatalog[game as GameId] : undefined
  return {
    headerTitle: entry ? `派蒙的应急手册 · ${entry.tagline}` : 'PaiBook · 派书',
    tagline: '不是应急食品，是应急手册！',
    gameName: entry ? entry.titleZh : '《原神》《崩坏：星穹铁道》《绝区零》',
    attribution: entry?.attribution,
  }
}
