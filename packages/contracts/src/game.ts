import { z } from 'zod'

export const gameIdSchema = z.enum(['genshin', 'honkaistarrail', 'zenlesszonezero'])
export type GameId = z.infer<typeof gameIdSchema>

export const gameCatalog: Record<GameId, { titleZh: string; titleEn: string; tagline: string }> = {
  genshin: { titleZh: '原神', titleEn: 'Genshin Impact', tagline: '提瓦特篇' },
  honkaistarrail: { titleZh: '崩坏：星穹铁道', titleEn: 'Honkai: Star Rail', tagline: '星穹列车篇' },
  zenlesszonezero: { titleZh: '绝区零', titleEn: 'Zenless Zone Zero', tagline: '新艾利都篇' },
}
