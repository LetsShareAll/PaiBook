import { z } from 'zod'
import { entityKindSchema } from './entity.ts'
import { gameIdSchema } from './game.ts'
import { guideSlugSchema } from './admin.ts'

/**
 * 站点内容的完整导出格式（版本 1）。
 * 导出/导入用同一份契约：导入时按它校验，避免把半截 JSON 灌进库里。
 */
export const contentExportSchema = z.object({
  schema: z.literal(1),
  gameId: gameIdSchema,
  exportedAt: z.string(),
  versions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      sortKey: z.number().int(),
    }),
  ),
  entities: z.array(
    z.object({
      id: z.string(),
      kind: entityKindSchema,
      nameZh: z.string(),
      nameEn: z.string().nullable(),
    }),
  ),
  guides: z.array(
    z.object({
      id: z.string(),
      slug: guideSlugSchema,
      title: z.string(),
      summary: z.string(),
      body: z.string(),
      status: z.enum(['draft', 'published']),
      versionId: z.string().nullable(),
      publishedAt: z.string().nullable(),
      entityIds: z.array(z.string()),
    }),
  ),
  links: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      url: z.string(),
      sourceName: z.string().nullable(),
      author: z.string().nullable(),
      entityIds: z.array(z.string()),
    }),
  ),
})

export type ContentExport = z.infer<typeof contentExportSchema>
