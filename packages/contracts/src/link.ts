import { z } from 'zod'
import { gameIdSchema } from './game.ts'
import { entityRefSchema } from './entity.ts'

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

/** 站外推荐的写入契约：正文永远不在本站，只有标题、自写摘要与外链。 */
export const linkWriteSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(300),
  url: z.string().refine((value) => /^https?:\/\//.test(value), '必须是 http(s) 链接'),
  sourceName: z.string().max(60).nullable(),
  author: z.string().max(60).nullable(),
  entityIds: z.array(z.string()),
})
export type LinkWrite = z.infer<typeof linkWriteSchema>
