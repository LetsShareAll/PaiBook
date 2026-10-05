import { desc, eq, inArray } from 'drizzle-orm'
import type { EntityKind, EntityRef, GameId, GuideLink } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, link, linkEntity } from '../schema.ts'

export interface LinkWriteInput {
  title: string
  summary: string
  url: string
  sourceName: string | null
  author: string | null
  entityIds: string[]
}

export async function listLinks(db: Db, gameId: GameId): Promise<GuideLink[]> {
  const rows = await db
    .select({
      id: link.id,
      gameId: link.gameId,
      title: link.title,
      summary: link.summary,
      url: link.url,
      sourceName: link.sourceName,
      author: link.author,
    })
    .from(link)
    .where(eq(link.gameId, gameId))
    .orderBy(desc(link.createdAt))

  if (rows.length === 0) return []

  const links = await db
    .select({
      linkId: linkEntity.linkId,
      id: entity.id,
      kind: entity.kind,
      nameZh: entity.nameZh,
    })
    .from(linkEntity)
    .innerJoin(entity, eq(entity.id, linkEntity.entityId))
    .where(
      inArray(
        linkEntity.linkId,
        rows.map((row) => row.id),
      ),
    )

  const grouped = new Map<string, EntityRef[]>()
  for (const row of links) {
    const bucket = grouped.get(row.linkId) ?? []
    bucket.push({ id: row.id, kind: row.kind as EntityKind, nameZh: row.nameZh })
    grouped.set(row.linkId, bucket)
  }

  return rows.map((row) => ({ ...row, gameId: row.gameId as GameId, entities: grouped.get(row.id) ?? [] }))
}

export async function createLink(db: Db, gameId: GameId, input: LinkWriteInput): Promise<string> {
  const id = `${gameId}:link:${crypto.randomUUID()}`
  await db.insert(link).values({
    id,
    gameId,
    title: input.title,
    summary: input.summary,
    url: input.url,
    sourceName: input.sourceName,
    author: input.author,
  })

  if (input.entityIds.length > 0) {
    await db.insert(linkEntity).values(input.entityIds.map((entityId) => ({ linkId: id, entityId })))
  }

  return id
}

export async function deleteLink(db: Db, gameId: GameId, id: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: link.id })
    .from(link)
    .where(eq(link.id, id))
    .limit(1)

  if (!existing) return false
  await db.delete(linkEntity).where(eq(linkEntity.linkId, id))
  await db.delete(link).where(eq(link.id, id))
  return true
}
