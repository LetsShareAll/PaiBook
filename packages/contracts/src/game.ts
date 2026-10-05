import { z } from 'zod'

export const gameIdSchema = z.enum(['genshin', 'honkaistarrail', 'zenlesszonezero'])
export type GameId = z.infer<typeof gameIdSchema>

export interface GameCatalogEntry {
  titleZh: string
  titleEn: string
  tagline: string
  /** 官方创作指引要求的署名句（逐字保留）。 */
  attribution?: string
}

export const gameCatalog: Record<GameId, GameCatalogEntry> = {
  genshin: { titleZh: '原神', titleEn: 'Genshin Impact', tagline: '提瓦特篇' },
  honkaistarrail: {
    titleZh: '崩坏：星穹铁道',
    titleEn: 'Honkai: Star Rail',
    tagline: '星穹列车篇',
    attribution:
      '© 米哈游版权所有。《崩坏：星穹铁道》素材的权利归米哈游所有，其他内容的相关权利、利益均归各自所有者享有。',
  },
  zenlesszonezero: { titleZh: '绝区零', titleEn: 'Zenless Zone Zero', tagline: '新艾利都篇' },
}
