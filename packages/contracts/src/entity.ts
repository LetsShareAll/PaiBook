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

export const entitySchema = entityRefSchema.extend({
  gameId: gameIdSchema,
  nameEn: z.string().nullable(),
})
export type Entity = z.infer<typeof entitySchema>
