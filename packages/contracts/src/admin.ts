import { z } from 'zod'
import { guideStatusSchema, guideSummarySchema } from './guide.ts'
import { entityKindSchema } from './entity.ts'

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
  summary: z.string(),
  body: z.string(),
  versionId: z.string().nullable(),
  entityIds: z.array(z.string()),
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
