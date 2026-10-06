import { z } from 'zod'
import { entitySchema } from './entity.ts'
import { guideSummarySchema } from './guide.ts'
import { linkSchema } from './link.ts'

/** 图鉴条目：实体本身 + 挂在它身上的攻略与站外推荐。 */
export const codexEntrySchema = z.object({
  entity: entitySchema,
  guides: z.array(guideSummarySchema),
  links: z.array(linkSchema),
})
export type CodexEntry = z.infer<typeof codexEntrySchema>
