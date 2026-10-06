import { and, asc, desc, eq } from 'drizzle-orm'
import type { CodexEntry, Entity, EntityFacets, EntityKind, GameId, GuideSummary } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { entity, guide, guideEntity, version } from '../schema.ts'
import { guideColumns, loadEntities, toSummary } from './guides.ts'
import { listLinks } from './links.ts'

/** facets 存的是 JSON 文本，读出来一律当"可能坏掉"处理：解析不了就当空。 */
export function parseFacets(raw: string | null): EntityFacets {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

export interface EntityRow {
  id: string
  gameId: string
  kind: string
  nameZh: string
  nameEn: string | null
  slug: string | null
  facets: string | null
}

export function toEntity(row: EntityRow): Entity {
  return {
    id: row.id,
    gameId: row.gameId as GameId,
    kind: row.kind as EntityKind,
    nameZh: row.nameZh,
    nameEn: row.nameEn,
    // slug 在 0003 迁移之前建的行上可能为空，退回 id 的最后一段。
    slug: row.slug ?? row.id.slice(row.id.lastIndexOf(':') + 1),
    facets: parseFacets(row.facets),
  }
}

/** 图鉴列表：本游戏的全部实体，含分类元数据。 */
export async function listCodexEntities(db: Db, gameId: GameId): Promise<Entity[]> {
  const rows = await db
    .select()
    .from(entity)
    .where(eq(entity.gameId, gameId))
    .orderBy(asc(entity.nameZh))
  return rows.map(toEntity)
}

/** 图鉴条目：按 slug 取实体，连同挂在它身上的已发布攻略与站外推荐。 */
export async function getCodexEntry(db: Db, gameId: GameId, slug: string): Promise<CodexEntry | null> {
  const [row] = await db
    .select()
    .from(entity)
    .where(and(eq(entity.gameId, gameId), eq(entity.slug, slug)))
    .limit(1)
  if (!row) return null

  const guideRows = await db
    .select(guideColumns)
    .from(guideEntity)
    .innerJoin(guide, eq(guide.id, guideEntity.guideId))
    .leftJoin(version, eq(version.id, guide.versionId))
    .where(and(eq(guideEntity.entityId, row.id), eq(guide.status, 'published')))
    .orderBy(desc(guide.publishedAt))

  const entityMap = await loadEntities(
    db,
    guideRows.map((item) => item.id),
  )
  const guides: GuideSummary[] = guideRows.map((item) => toSummary(item, entityMap.get(item.id) ?? []))

  // 站外推荐的数量很少，直接按游戏取回来过滤，不另写一套 join。
  const links = (await listLinks(db, gameId)).filter((item) =>
    item.entities.some((ref) => ref.id === row.id),
  )

  return { entity: toEntity(row), guides, links }
}
