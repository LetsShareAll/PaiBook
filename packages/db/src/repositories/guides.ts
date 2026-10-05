import { and, desc, eq, inArray } from 'drizzle-orm'
import type { EntityRef, EntityKind, GameId, GuideDetail, GuideSummary } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, guide, guideEntity, version } from '../schema.ts'

export type GuideRow = {
  id: string
  gameId: string
  slug: string
  title: string
  summary: string
  publishedAt: string | null
  versionId: string | null
  versionLabel: string | null
}

export function toSummary(row: GuideRow, entities: EntityRef[]): GuideSummary {
  return {
    id: row.id,
    gameId: row.gameId as GameId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: row.publishedAt,
    version: row.versionId && row.versionLabel ? { id: row.versionId, label: row.versionLabel } : null,
    entities,
  }
}

export async function loadEntities(db: Db, guideIds: string[]): Promise<Map<string, EntityRef[]>> {
  const grouped = new Map<string, EntityRef[]>()
  if (guideIds.length === 0) return grouped

  const rows = await db
    .select({
      guideId: guideEntity.guideId,
      id: entity.id,
      kind: entity.kind,
      nameZh: entity.nameZh,
    })
    .from(guideEntity)
    .innerJoin(entity, eq(entity.id, guideEntity.entityId))
    .where(inArray(guideEntity.guideId, guideIds))

  for (const row of rows) {
    const bucket = grouped.get(row.guideId) ?? []
    bucket.push({ id: row.id, kind: row.kind as EntityKind, nameZh: row.nameZh })
    grouped.set(row.guideId, bucket)
  }
  return grouped
}

export const guideColumns = {
  id: guide.id,
  gameId: guide.gameId,
  slug: guide.slug,
  title: guide.title,
  summary: guide.summary,
  publishedAt: guide.publishedAt,
  versionId: version.id,
  versionLabel: version.label,
}

export async function listPublishedGuides(db: Db, gameId: GameId): Promise<GuideSummary[]> {
  const rows = await db
    .select(guideColumns)
    .from(guide)
    .leftJoin(version, eq(version.id, guide.versionId))
    .where(and(eq(guide.gameId, gameId), eq(guide.status, 'published')))
    .orderBy(desc(guide.publishedAt))

  const entities = await loadEntities(
    db,
    rows.map((row) => row.id),
  )
  return rows.map((row) => toSummary(row, entities.get(row.id) ?? []))
}

export async function getPublishedGuide(db: Db, gameId: GameId, slug: string): Promise<GuideDetail | null> {
  const [row] = await db
    .select({ ...guideColumns, body: guide.body })
    .from(guide)
    .leftJoin(version, eq(version.id, guide.versionId))
    .where(and(eq(guide.gameId, gameId), eq(guide.slug, slug), eq(guide.status, 'published')))
    .limit(1)

  if (!row) return null
  const entities = await loadEntities(db, [row.id])
  return { ...toSummary(row, entities.get(row.id) ?? []), body: row.body }
}

/** 跨游戏的最近更新，供门厅使用。 */
export async function listRecentGuides(db: Db, limit = 12): Promise<GuideSummary[]> {
  const rows = await db
    .select(guideColumns)
    .from(guide)
    .leftJoin(version, eq(version.id, guide.versionId))
    .where(eq(guide.status, 'published'))
    .orderBy(desc(guide.publishedAt))
    .limit(limit)

  const entities = await loadEntities(
    db,
    rows.map((row) => row.id),
  )
  return rows.map((row) => toSummary(row, entities.get(row.id) ?? []))
}
