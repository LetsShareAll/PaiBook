import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type { EntityFacets, EntityKind, GameId } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, guide, guideEntity, linkEntity, version } from '../schema.ts'

export interface EntityWriteInput {
  kind: EntityKind
  nameZh: string
  nameEn: string | null
  /** 分类元数据（element / class / rarity / faction）。手工维护的站靠它填图鉴。 */
  facets?: EntityFacets
}

export function slugifyEntity(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 图鉴地址要在游戏内唯一：撞了就加序号，中文名 slug 化后为空就退回随机短码。 */
async function uniqueSlug(db: Db, gameId: GameId, nameEn: string | null, nameZh: string): Promise<string> {
  const base = slugifyEntity(nameEn || nameZh) || crypto.randomUUID().slice(0, 8)
  const taken = new Set(
    (
      await db.select({ slug: entity.slug }).from(entity).where(eq(entity.gameId, gameId))
    ).map((row) => row.slug),
  )
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export async function listVersions(db: Db, gameId: GameId): Promise<{ id: string; label: string }[]> {
  return db
    .select({ id: version.id, label: version.label })
    .from(version)
    .where(eq(version.gameId, gameId))
    .orderBy(desc(version.sortKey), asc(version.label))
}

export async function createEntity(db: Db, gameId: GameId, input: EntityWriteInput): Promise<string> {
  const id = `${gameId}:entity:${crypto.randomUUID()}`
  const facets = input.facets ?? {}
  await db.insert(entity).values({
    id,
    gameId,
    kind: input.kind,
    nameZh: input.nameZh,
    nameEn: input.nameEn,
    slug: await uniqueSlug(db, gameId, input.nameEn, input.nameZh),
    facets: Object.keys(facets).length > 0 ? JSON.stringify(facets) : null,
  })
  return id
}

/**
 * 删除实体：先解除引用再删本体。
 * 返回被影响的关联数量，让界面能如实告诉作者"有 N 篇攻略失去了这个标签"。
 */
export async function deleteEntity(
  db: Db,
  gameId: GameId,
  id: string,
): Promise<{ guides: number; links: number } | null> {
  const [existing] = await db
    .select({ id: entity.id })
    .from(entity)
    .where(and(eq(entity.gameId, gameId), eq(entity.id, id)))
    .limit(1)
  if (!existing) return null

  const affectedGuides = await db
    .select({ guideId: guideEntity.guideId })
    .from(guideEntity)
    .where(eq(guideEntity.entityId, id))
  const affectedLinks = await db.select({ linkId: linkEntity.linkId }).from(linkEntity).where(eq(linkEntity.entityId, id))

  await db.delete(guideEntity).where(eq(guideEntity.entityId, id))
  await db.delete(linkEntity).where(eq(linkEntity.entityId, id))
  await db.delete(entity).where(eq(entity.id, id))

  return { guides: affectedGuides.length, links: affectedLinks.length }
}

export async function createVersion(db: Db, gameId: GameId, label: string, sortKey = 0): Promise<string> {
  const id = `${gameId}:version:${crypto.randomUUID()}`
  await db.insert(version).values({ id, gameId, label, sortKey })
  return id
}

/** 删除版本：把引用它的攻略置为"未指定版本"，再删本体。 */
export async function deleteVersion(db: Db, gameId: GameId, id: string): Promise<{ guides: number } | null> {
  const [existing] = await db
    .select({ id: version.id })
    .from(version)
    .where(and(eq(version.gameId, gameId), eq(version.id, id)))
    .limit(1)
  if (!existing) return null

  const affected = await db.select({ id: guide.id }).from(guide).where(eq(guide.versionId, id))
  if (affected.length > 0) {
    await db
      .update(guide)
      .set({ versionId: null })
      .where(
        inArray(
          guide.id,
          affected.map((row) => row.id),
        ),
      )
  }
  await db.delete(version).where(eq(version.id, id))

  return { guides: affected.length }
}
