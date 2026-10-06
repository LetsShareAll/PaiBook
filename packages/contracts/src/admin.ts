import { z } from 'zod'
import { guideStatusSchema, guideSummarySchema, versionRefSchema } from './guide.ts'
import { entityFacetsSchema, entityKindSchema, entityRefSchema } from './entity.ts'
import { gameIdSchema } from './game.ts'

export const guideSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能用小写字母、数字与连字符')

export const loginSchema = z.object({
  password: z.string().min(1),
})

export const guideWriteSchema = z.object({
  title: z.string().min(1).max(120),
  slug: guideSlugSchema,
  summary: z.string().max(300),
  body: z.string(),
  versionId: z.string().nullable(),
  entityIds: z.array(z.string()),
})
export type GuideWrite = z.infer<typeof guideWriteSchema>

export const adminGuideItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  status: guideStatusSchema,
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
})
export type AdminGuideItem = z.infer<typeof adminGuideItemSchema>

export const adminGuideDetailSchema = adminGuideItemSchema.extend({
  gameId: gameIdSchema,
  summary: z.string(),
  body: z.string(),
  versionId: z.string().nullable(),
  version: versionRefSchema.nullable(),
  entityIds: z.array(z.string()),
  entities: z.array(entityRefSchema),
})
export type AdminGuideDetail = z.infer<typeof adminGuideDetailSchema>

export const taxonomySchema = z.object({
  versions: z.array(z.object({ id: z.string(), label: z.string() })),
  entities: z.array(
    z.object({
      id: z.string(),
      kind: entityKindSchema,
      nameZh: z.string(),
    }),
  ),
})
export type Taxonomy = z.infer<typeof taxonomySchema>

export const adminGuideListSchema = z.object({
  items: z.array(adminGuideItemSchema),
})
export type AdminGuideList = z.infer<typeof adminGuideListSchema>

export { guideSummarySchema }

export const entityWriteSchema = z.object({
  kind: entityKindSchema,
  nameZh: z.string().min(1).max(40),
  nameEn: z.string().max(60).nullable(),
  /** 分类元数据。手工维护的站（绝区零）靠它把图鉴填起来。 */
  facets: entityFacetsSchema.optional(),
})
export type EntityWrite = z.infer<typeof entityWriteSchema>

export const versionWriteSchema = z.object({
  label: z.string().min(1).max(20),
  sortKey: z.number().int().min(0).max(9999).default(0),
})
export type VersionWrite = z.infer<typeof versionWriteSchema>
