import { eq, sql } from 'drizzle-orm'
import type { GameId, GuideSummary } from '@paibook/contracts'
import type { Db } from '../client.ts'
import { guide } from '../schema.ts'
import { toMatchExpression, toSearchText } from '../search.ts'
import { loadEntities, toSummary, type GuideRow } from './guides.ts'

interface SearchRow extends GuideRow {
  id: string
}

export async function searchPublishedGuides(
  db: Db,
  gameId: GameId | null,
  query: string,
  limit = 20,
): Promise<GuideSummary[]> {
  const match = toMatchExpression(query)
  if (!match) return []

  const gameFilter = gameId ? sql`AND g.game_id = ${gameId}` : sql``

  const rows = await db.all<SearchRow>(sql`
    SELECT g.id            AS id,
           g.game_id       AS gameId,
           g.slug          AS slug,
           g.title         AS title,
           g.summary       AS summary,
           g.published_at  AS publishedAt,
           v.id            AS versionId,
           v.label         AS versionLabel
    FROM guide_fts
    JOIN guide g ON g.id = guide_fts.guide_id
    LEFT JOIN version v ON v.id = g.version_id
    WHERE guide_fts MATCH ${match}
      ${gameFilter}
      AND g.status = 'published'
    ORDER BY bm25(guide_fts)
    LIMIT ${limit}
  `)

  const entities = await loadEntities(
    db,
    rows.map((row) => row.id),
  )
  return rows.map((row) => toSummary(row, entities.get(row.id) ?? []))
}

/** 把一篇攻略的标题/摘要/正文重新写进 FTS 索引。 */
export async function syncGuideSearch(db: Db, guideId: string): Promise<void> {
  const [row] = await db
    .select({ title: guide.title, summary: guide.summary, body: guide.body })
    .from(guide)
    .where(eq(guide.id, guideId))
    .limit(1)
  if (!row) return

  const text = toSearchText(`${row.title} ${row.summary} ${row.body}`)
  await db.run(sql`DELETE FROM guide_fts WHERE guide_id = ${guideId}`)
  await db.run(sql`INSERT INTO guide_fts (guide_id, text) VALUES (${guideId}, ${text})`)
}

/** 重建某个游戏的整个索引（首次建表、或改了分词规则时用）。 */
export async function reindexGuideSearch(db: Db, gameId: GameId): Promise<number> {
  await db.run(sql`DELETE FROM guide_fts WHERE guide_id IN (SELECT id FROM guide WHERE game_id = ${gameId})`)
  const rows = await db.select({ id: guide.id }).from(guide).where(eq(guide.gameId, gameId))
  for (const row of rows) await syncGuideSearch(db, row.id)
  return rows.length
}
