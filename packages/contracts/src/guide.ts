import { z } from 'zod'
import { gameIdSchema } from './game.ts'
import { entityRefSchema } from './entity.ts'

export const guideStatusSchema = z.enum(['draft', 'published'])
export type GuideStatus = z.infer<typeof guideStatusSchema>

export const versionRefSchema = z.object({
  id: z.string(),
  label: z.string(),
})
export type VersionRef = z.infer<typeof versionRefSchema>

export const guideSummarySchema = z.object({
  id: z.string(),
  gameId: gameIdSchema,
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  version: versionRefSchema.nullable(),
  entities: z.array(entityRefSchema),
  publishedAt: z.string().nullable(),
})
export type GuideSummary = z.infer<typeof guideSummarySchema>

export const guideDetailSchema = guideSummarySchema.extend({
  body: z.string(),
})
export type GuideDetail = z.infer<typeof guideDetailSchema>

export const guideListSchema = z.object({
  items: z.array(guideSummarySchema),
  total: z.number(),
})
export type GuideList = z.infer<typeof guideListSchema>

export const linkSchema = z.object({
  id: z.string(),
  gameId: gameIdSchema,
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  sourceName: z.string().nullable(),
  author: z.string().nullable(),
  entities: z.array(entityRefSchema),
})
export type GuideLink = z.infer<typeof linkSchema>

export const searchResultSchema = z.object({
  items: z.array(guideSummarySchema),
  total: z.number(),
})
export type SearchResult = z.infer<typeof searchResultSchema>
