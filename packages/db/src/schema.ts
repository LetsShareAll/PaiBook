import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const game = sqliteTable('game', {
  id: text('id').primaryKey(),
  titleZh: text('title_zh').notNull(),
  titleEn: text('title_en').notNull(),
  sort: integer('sort').notNull().default(0),
})

export const version = sqliteTable(
  'version',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id),
    label: text('label').notNull(),
    releasedOn: text('released_on'),
    sortKey: integer('sort_key').notNull().default(0),
  },
  (t) => [uniqueIndex('version_game_label_idx').on(t.gameId, t.label)],
)

export const entity = sqliteTable(
  'entity',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id),
    kind: text('kind').notNull(),
    nameZh: text('name_zh').notNull(),
    nameEn: text('name_en'),
    /** 图鉴地址用；游戏内唯一。 */
    slug: text('slug'),
    /** 分类元数据（JSON）：element / class / rarity / faction。只存分类，不存数值。 */
    facets: text('facets'),
  },
  (t) => [index('entity_game_kind_idx').on(t.gameId, t.kind)],
)

export const guide = sqliteTable(
  'guide',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    body: text('body').notNull().default(''),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    versionId: text('version_id').references(() => version.id),
    publishedAt: text('published_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => [
    uniqueIndex('guide_game_slug_idx').on(t.gameId, t.slug),
    index('guide_game_status_idx').on(t.gameId, t.status),
  ],
)

export const guideEntity = sqliteTable(
  'guide_entity',
  {
    guideId: text('guide_id')
      .notNull()
      .references(() => guide.id, { onDelete: 'cascade' }),
    entityId: text('entity_id')
      .notNull()
      .references(() => entity.id),
  },
  (t) => [primaryKey({ columns: [t.guideId, t.entityId] })],
)

export const link = sqliteTable(
  'link',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => game.id),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    url: text('url').notNull(),
    sourceName: text('source_name'),
    author: text('author'),
    versionId: text('version_id').references(() => version.id),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => [index('link_game_idx').on(t.gameId)],
)

export const linkEntity = sqliteTable(
  'link_entity',
  {
    linkId: text('link_id')
      .notNull()
      .references(() => link.id, { onDelete: 'cascade' }),
    entityId: text('entity_id')
      .notNull()
      .references(() => entity.id),
  },
  (t) => [primaryKey({ columns: [t.linkId, t.entityId] })],
)
