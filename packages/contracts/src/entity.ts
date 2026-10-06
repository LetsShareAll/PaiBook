import { z } from 'zod'
import { gameIdSchema } from './game.ts'

export const entityKindSchema = z.enum([
  'character',
  'agent',
  'enemy',
  'weapon',
  'artifact',
  'disc',
  'bangboo',
  'other',
])
export type EntityKind = z.infer<typeof entityKindSchema>

export const entityRefSchema = z.object({
  id: z.string(),
  kind: entityKindSchema,
  nameZh: z.string(),
})
export type EntityRef = z.infer<typeof entityRefSchema>

/**
 * 分类元数据。三款游戏的分类词表不一样，所以统一收进这套四键词表：
 *   `element` 元素 / 属性 · `class` 职业（武器类型 / 命途 / 定位） · `rarity` 稀有度 · `faction` 阵营 / 所属
 *
 * **只放分类，不放数值。** 攻击力、倍率、成长曲线这类数值必须能追到游戏内文本或官方公告
 * （ADR-0009），社区数据集达不到那条线，所以它们不进站。
 */
export const entityFacetsSchema = z.record(z.string(), z.string())
export type EntityFacets = z.infer<typeof entityFacetsSchema>

export const entitySchema = entityRefSchema.extend({
  gameId: gameIdSchema,
  nameEn: z.string().nullable(),
  /** 图鉴地址用；游戏内唯一。 */
  slug: z.string(),
  facets: entityFacetsSchema,
})
export type Entity = z.infer<typeof entitySchema>
