import { eq } from 'drizzle-orm'
import type { ContentExport, EntityKind, GameId } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, guide, guideEntity, link, linkEntity, version } from '../schema.ts'
import { syncGuideSearch } from './search.ts'

/** 导出本站全部内容：攻略（含正文）、实体、版本、外链，以及它们之间的关联。 */
export async function exportContent(db: Db, gameId: GameId): Promise<ContentExport> {
  const [versions, entities, guides, guideLinks, links, linkLinks] = await Promise.all([
    db.select().from(version).where(eq(version.gameId, gameId)),
    db.select().from(entity).where(eq(entity.gameId, gameId)),
    db.select().from(guide).where(eq(guide.gameId, gameId)),
    db.select({ guideId: guideEntity.guideId, entityId: guideEntity.entityId }).from(guideEntity),
    db.select().from(link).where(eq(link.gameId, gameId)),
    db.select({ linkId: linkEntity.linkId, entityId: linkEntity.entityId }).from(linkEntity),
  ])

  return {
    schema: 1,
    gameId,
    exportedAt: new Date().toISOString(),
    versions: versions.map((row) => ({ id: row.id, label: row.label, sortKey: row.sortKey })),
    entities: entities.map((row) => ({
      id: row.id,
      kind: row.kind as EntityKind,
      nameZh: row.nameZh,
      nameEn: row.nameEn ?? null,
    })),
    guides: guides.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      status: row.status as 'draft' | 'published',
      versionId: row.versionId ?? null,
      publishedAt: row.publishedAt ?? null,
      entityIds: guideLinks.filter((item) => item.guideId === row.id).map((item) => item.entityId),
    })),
    links: links.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      url: row.url,
      sourceName: row.sourceName ?? null,
      author: row.author ?? null,
      entityIds: linkLinks.filter((item) => item.linkId === row.id).map((item) => item.entityId),
    })),
  }
}

export interface ImportSummary {
  versions: number
  entities: number
  guides: number
  links: number
}

/**
 * 导入：按 id 覆盖写（幂等），并重建被导入攻略的搜索索引。
 * 只覆盖同 id 的记录，不会清空库里其它内容。
 */
export async function importContent(db: Db, payload: ContentExport): Promise<ImportSummary> {
  for (const row of payload.versions) {
    await db
      .insert(version)
      .values({ id: row.id, gameId: payload.gameId, label: row.label, sortKey: row.sortKey })
      .onConflictDoUpdate({ target: version.id, set: { label: row.label, sortKey: row.sortKey } })
  }

  for (const row of payload.entities) {
    await db
      .insert(entity)
      .values({ id: row.id, gameId: payload.gameId, kind: row.kind, nameZh: row.nameZh, nameEn: row.nameEn })
      .onConflictDoUpdate({ target: entity.id, set: { kind: row.kind, nameZh: row.nameZh, nameEn: row.nameEn } })
  }

  for (const row of payload.guides) {
    await db
      .insert(guide)
      .values({
        id: row.id,
        gameId: payload.gameId,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        body: row.body,
        status: row.status,
        versionId: row.versionId,
        publishedAt: row.publishedAt,
      })
      .onConflictDoUpdate({
        target: guide.id,
        set: {
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          body: row.body,
          status: row.status,
          versionId: row.versionId,
          publishedAt: row.publishedAt,
          updatedAt: new Date().toISOString(),
        },
      })

    await db.delete(guideEntity).where(eq(guideEntity.guideId, row.id))
    if (row.entityIds.length > 0) {
      await db.insert(guideEntity).values(row.entityIds.map((entityId) => ({ guideId: row.id, entityId })))
    }
    await syncGuideSearch(db, row.id)
  }

  for (const row of payload.links) {
    await db
      .insert(link)
      .values({
        id: row.id,
        gameId: payload.gameId,
        title: row.title,
        summary: row.summary,
        url: row.url,
        sourceName: row.sourceName,
        author: row.author,
      })
      .onConflictDoUpdate({
        target: link.id,
        set: { title: row.title, summary: row.summary, url: row.url, sourceName: row.sourceName, author: row.author },
      })

    await db.delete(linkEntity).where(eq(linkEntity.linkId, row.id))
    if (row.entityIds.length > 0) {
      await db.insert(linkEntity).values(row.entityIds.map((entityId) => ({ linkId: row.id, entityId })))
    }
  }

  return {
    versions: payload.versions.length,
    entities: payload.entities.length,
    guides: payload.guides.length,
    links: payload.links.length,
  }
}
