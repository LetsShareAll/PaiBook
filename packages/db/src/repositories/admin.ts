import { and, asc, desc, eq } from 'drizzle-orm'
import type { AdminGuideDetail, AdminGuideItem, GameId, Taxonomy } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, guide, guideEntity, version } from '../schema.ts'

export async function listGuidesForAdmin(db: Db, gameId: GameId): Promise<AdminGuideItem[]> {
  return db
    .select({
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      status: guide.status,
      updatedAt: guide.updatedAt,
      publishedAt: guide.publishedAt,
    })
    .from(guide)
    .where(eq(guide.gameId, gameId))
    .orderBy(desc(guide.updatedAt))
}

export async function getGuideForAdmin(db: Db, gameId: GameId, id: string): Promise<AdminGuideDetail | null> {
  const [row] = await db
    .select({
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      status: guide.status,
      summary: guide.summary,
      body: guide.body,
      versionId: guide.versionId,
      updatedAt: guide.updatedAt,
      publishedAt: guide.publishedAt,
    })
    .from(guide)
    .where(and(eq(guide.gameId, gameId), eq(guide.id, id)))
    .limit(1)

  if (!row) return null

  const links = await db
    .select({ entityId: guideEntity.entityId })
    .from(guideEntity)
    .where(eq(guideEntity.guideId, id))

  return { ...row, entityIds: links.map((link) => link.entityId) }
}

export interface GuideWriteInput {
  title: string
  slug: string
  summary: string
  body: string
  versionId: string | null
  entityIds: string[]
}

async function replaceGuideEntities(db: Db, guideId: string, entityIds: string[]): Promise<void> {
  await db.delete(guideEntity).where(eq(guideEntity.guideId, guideId))
  if (entityIds.length > 0) {
    await db.insert(guideEntity).values(entityIds.map((entityId) => ({ guideId, entityId })))
  }
}

export async function createGuide(db: Db, gameId: GameId, input: GuideWriteInput): Promise<string> {
  const id = `${gameId}:${crypto.randomUUID()}`
  await db.insert(guide).values({
    id,
    gameId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    body: input.body,
    status: 'draft',
    versionId: input.versionId,
  })
  await replaceGuideEntities(db, id, input.entityIds)
  return id
}

export async function updateGuide(db: Db, id: string, input: GuideWriteInput): Promise<void> {
  await db
    .update(guide)
    .set({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      versionId: input.versionId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(guide.id, id))
  await replaceGuideEntities(db, id, input.entityIds)
}

export async function setGuideStatus(
  db: Db,
  id: string,
  status: 'draft' | 'published',
): Promise<{ slug: string; status: 'draft' | 'published'; publishedAt: string | null } | null> {
  const [current] = await db
    .select({ slug: guide.slug, publishedAt: guide.publishedAt })
    .from(guide)
    .where(eq(guide.id, id))
    .limit(1)

  if (!current) return null

  const publishedAt = status === 'published' ? (current.publishedAt ?? new Date().toISOString()) : null
  await db
    .update(guide)
    .set({ status, publishedAt, updatedAt: new Date().toISOString() })
    .where(eq(guide.id, id))

  return { slug: current.slug, status, publishedAt }
}

export async function listTaxonomy(db: Db, gameId: GameId): Promise<Taxonomy> {
  const [versions, entities] = await Promise.all([
    db
      .select({ id: version.id, label: version.label })
      .from(version)
      .where(eq(version.gameId, gameId))
      .orderBy(desc(version.sortKey), asc(version.label)),
    db
      .select({ id: entity.id, kind: entity.kind, nameZh: entity.nameZh })
      .from(entity)
      .where(eq(entity.gameId, gameId))
      .orderBy(asc(entity.nameZh)),
  ])

  return {
    versions,
    entities: entities.map((row) => ({ id: row.id, kind: row.kind as Taxonomy['entities'][number]['kind'], nameZh: row.nameZh })),
  }
}
