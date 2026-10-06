/**
 * 载入实体名单（角色 / 代理人）到 D1 —— 只载入事实性元数据，不含任何攻略正文。
 *
 * 数据来源（许可清晰、社区长期维护的事实数据）：
 *   - 原神：genshin-db（MIT）
 *   - 星铁：Mar-7th/StarRailRes 的角色表（中文名 + 稀有度/命途/属性，仅取名字）
 *
 * 为什么不从米游社抓：它没有 robots.txt，而内容受版权保护、还受其 ToS 约束；
 * 攻略正文一旦被抓进来就是"纯搬运"——那与 ADR-0007 以及本站自己的定位直接冲突。
 *
 * 幂等：id = `<game>:character:<英文名 slug>`，配合 (game, kind, name_zh) 的唯一索引，
 * 重复运行只会补上新增的角色。
 *
 * 用法：
 *   node scripts/import-entities.mjs --local            写入本地 D1
 *   node scripts/import-entities.mjs --remote           写入线上 D1
 *   node scripts/import-entities.mjs --local --dry-run  只打印将要写入的行数
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const target = args.includes('--remote') ? '--remote' : '--local'
const dryRun = args.includes('--dry-run')

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// 源数据里的占位符（星铁开拓者以 {NICKNAME} 形式出现 10 次）要映射成正式名，
// 否则分类表里会出现一行 "{NICKNAME}" 这种脏数据。
const PLACEHOLDER_NAMES = { '{NICKNAME}': '开拓者' }

const rows = []

function addRow(gameId, rawNameZh, nameEn) {
  const nameZh = PLACEHOLDER_NAMES[rawNameZh?.trim()] ?? rawNameZh
  const slug = slugify(nameEn || nameZh)
  if (!slug || !nameZh) return
  rows.push({ id: `${gameId}:character:${slug}`, gameId, nameZh: nameZh.trim(), nameEn: nameEn?.trim() || null })
}

// --- 原神：genshin-db（MIT）---
async function collectGenshin() {
  const genshin = (await import('genshin-db')).default ?? (await import('genshin-db'))
  const englishNames = genshin.characters('names', { matchCategories: true })
  for (const nameEn of englishNames) {
    const detail = genshin.characters(nameEn, { resultLanguage: 'ChineseSimplified' })
    if (!detail?.name) continue
    addRow('genshin', detail.name, nameEn)
  }
  console.log(`原神：${englishNames.length} 个角色`)
}

// --- 星铁：StarRailRes 角色表（中文名）+ 英文表（用于生成稳定 id）---
async function collectHonkaiStarRail() {
  const base = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min'
  const [cn, en] = await Promise.all([
    fetch(`${base}/cn/characters.json`).then((res) => (res.ok ? res.json() : {})),
    fetch(`${base}/en/characters.json`).then((res) => (res.ok ? res.json() : {})),
  ])
  let count = 0
  for (const [id, entry] of Object.entries(cn)) {
    if (!entry?.name) continue
    addRow('honkaistarrail', entry.name, en[id]?.name ?? null)
    count += 1
  }
  console.log(`星铁：${count} 个角色`)
}

// --- 写库 ---
function applySql(statements, label) {
  const file = join(mkdtempSync(join(tmpdir(), 'pb-entities-')), 'entities.sql')
  writeFileSync(file, statements.join('\n') + '\n')
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'paibook', target, '--file', file], {
    cwd: join(root, 'apps/genshin'),
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  console.log(`${label}：已写入 ${statements.length} 行（${target}）`)
}

await collectGenshin()
await collectHonkaiStarRail()
// 绝区零：暂无许可清晰的公开数据源，留待补（可在写作台的「分类维护」手工添加）

const escape = (value) => String(value).replaceAll("'", "''")
const statements = rows.map(
  (row) =>
    `INSERT OR IGNORE INTO entity (id, game_id, kind, name_zh, name_en) VALUES (` +
    `'${escape(row.id)}', '${escape(row.gameId)}', 'character', '${escape(row.nameZh)}', ` +
    `${row.nameEn ? `'${escape(row.nameEn)}'` : 'NULL'});`,
)

console.log(`\n共 ${rows.length} 行：原神 ${rows.filter((r) => r.gameId === 'genshin').length}、星铁 ${rows.filter((r) => r.gameId === 'honkaistarrail').length}`)

if (dryRun) {
  console.log('（dry-run，未写库）示例：')
  console.log(statements.slice(0, 3).join('\n'))
} else {
  applySql(statements, '实体')
}
