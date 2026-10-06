/**
 * 载入实体名单（角色 / 代理人）到 D1 —— 只载入事实性元数据，不含任何攻略正文。
 *
 * 数据来源（许可清晰、社区长期维护的事实数据）：
 *   - 原神：genshin-db（MIT）
 *   - 星铁：Mar-7th/StarRailRes 的角色表 + 命途/属性词表
 *
 * 导入的是**分类元数据**（element / class / rarity / faction），不是数值。
 * 攻击力、倍率、成长曲线这类数值必须能追到游戏内文本或官方公告（ADR-0009），
 * 社区数据集达不到那条线，所以它们不进站。
 *
 * 为什么不从米游社 / bwiki 抓：内容受版权保护、还受各自 ToS 约束；攻略正文一旦被抓进来
 * 就是"纯搬运"——那与 ADR-0007、ADR-0009 以及本站自己的定位直接冲突。
 *
 * 幂等：id = `<game>:<kind>:<英文名 slug>`，用 ON CONFLICT DO UPDATE 重写，
 * 所以重复运行既补新角色，也把老行的 slug / facets 补上。
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

function addRow(gameId, kind, rawNameZh, nameEn, facets = {}) {
  const nameZh = PLACEHOLDER_NAMES[rawNameZh?.trim()] ?? rawNameZh
  const slug = slugify(nameEn || nameZh)
  if (!slug || !nameZh) return
  const clean = Object.fromEntries(
    Object.entries(facets).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  )
  rows.push({
    id: `${gameId}:${kind}:${slug}`,
    gameId,
    kind,
    slug,
    nameZh: nameZh.trim(),
    nameEn: nameEn?.trim() || null,
    facets: clean,
  })
}

// --- 原神：genshin-db（MIT）---
async function collectGenshin() {
  const genshin = (await import('genshin-db')).default ?? (await import('genshin-db'))
  const englishNames = genshin.characters('names', { matchCategories: true })
  for (const nameEn of englishNames) {
    const detail = genshin.characters(nameEn, { resultLanguage: 'ChineseSimplified' })
    if (!detail?.name) continue
    addRow('genshin', 'character', detail.name, nameEn, {
      element: detail.elementText,
      class: detail.weaponText,
      rarity: detail.rarity ? String(detail.rarity) : null,
      // 玩家筛选"璃月 / 蒙德"时用的是地区，不是社团；社团名太长且一角色常有多个。
      faction: detail.region,
    })
  }
  console.log(`原神：${englishNames.length} 个角色`)
}

// --- 星铁：StarRailRes 角色表（中文名）+ 词表（把命途/属性的英文码翻成中文）---
async function collectHonkaiStarRail() {
  const base = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min'
  const load = (path) => fetch(`${base}/${path}`).then((res) => (res.ok ? res.json() : {}))
  const [cn, en, paths, elements] = await Promise.all([
    load('cn/characters.json'),
    load('en/characters.json'),
    load('cn/paths.json'),
    load('cn/elements.json'),
  ])
  let count = 0
  for (const [id, entry] of Object.entries(cn)) {
    if (!entry?.name) continue
    addRow('honkaistarrail', 'character', entry.name, en[id]?.name ?? null, {
      element: elements[entry.element]?.name,
      class: paths[entry.path]?.name,
      rarity: entry.rarity ? String(entry.rarity) : null,
    })
    count += 1
  }
  console.log(`星铁：${count} 个角色`)
}

// 源数据里有"同名不同形态"的角色：三月七（存护）与三月七（巡猎）在表里都叫「三月七」，
// 开拓者更是同一个名字占了 10 行。它们既是不同的可玩角色，撞上 (game, kind, name_zh) 的
// 唯一索引就会被整行丢掉。用玩家实际在用的叫法把它们分开：三月七·巡猎、开拓者·毁灭。
function disambiguate(list) {
  const slugs = new Set()
  const names = new Set()
  const out = []

  for (const row of list) {
    const prefix = `${row.gameId}|${row.kind}|`
    const tags = [row.facets.class, row.facets.element].filter(Boolean)
    let slug = row.slug
    let nameZh = row.nameZh

    if (slugs.has(prefix + slug)) {
      const base = `${slug}-${tags.map(slugify).find(Boolean) ?? 'v'}`
      let candidate = base
      let n = 2
      while (slugs.has(prefix + candidate)) candidate = `${base}-${n++}`
      slug = candidate
    }

    if (names.has(prefix + nameZh)) {
      // 优先只用职业（三月七·巡猎、开拓者·毁灭）；职业也撞了就补属性，再撞才加序号。
      const bases = [tags[0], tags.join('·'), slug].filter(Boolean)
      let candidate = ''
      for (const base of bases) {
        const attempt = `${nameZh}·${base}`
        if (!names.has(prefix + attempt)) {
          candidate = attempt
          break
        }
      }
      if (!candidate) {
        const base = `${nameZh}·${tags[0] ?? slug}`
        let n = 2
        while (names.has(prefix + `${base}·${n}`)) n += 1
        candidate = `${base}·${n}`
      }
      nameZh = candidate
    }

    slugs.add(prefix + slug)
    names.add(prefix + nameZh)
    out.push({ ...row, slug, id: `${row.gameId}:${row.kind}:${slug}`, nameZh })
  }

  const renamed = out.filter((row, index) => row.nameZh !== list[index]?.nameZh)
  if (renamed.length > 0) {
    console.log(`同名不同形态：${renamed.length} 行改名 → ${renamed.map((r) => r.nameZh).join('、')}`)
  }

  return out
}

// --- 写库 ---
// 本地库按应用目录分开存（miniflare 各自一份 state），所以 --local 要把同一份 SQL
// 对四个应用各跑一遍；--remote 只有一份远端库，跑一次就够。
const LOCAL_APPS = ['genshin', 'honkaistarrail', 'zenlesszonezero', 'portal']

function applySqlTo(app, file, label) {
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'paibook', target, '--yes', '--file', file], {
    cwd: join(root, 'apps', app),
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  console.log(`${label}（${app}）：已写入 ${rows.length} 行`)
}

function applySql(statements, label) {
  const file = join(mkdtempSync(join(tmpdir(), 'pb-entities-')), 'entities.sql')
  writeFileSync(file, statements.join('\n') + '\n')
  if (target === '--local') {
    for (const app of LOCAL_APPS) applySqlTo(app, file, label)
  } else {
    applySqlTo('genshin', file, label)
  }
}

await collectGenshin()
await collectHonkaiStarRail()
// 绝区零：暂无许可清晰的公开数据源。官方角色页（zzz.mihoyo.com/character）有名单、英文名与所属，
// 但没有稀有度/属性/定位——那部分只能在写作台的「分类维护」手工录。

const escape = (value) => String(value).replaceAll("'", "''")
const finalRows = disambiguate(rows)
const statements = finalRows.map(
  (row) =>
    `INSERT INTO entity (id, game_id, kind, name_zh, name_en, slug, facets) VALUES (` +
    `'${escape(row.id)}', '${escape(row.gameId)}', '${escape(row.kind)}', '${escape(row.nameZh)}', ` +
    `${row.nameEn ? `'${escape(row.nameEn)}'` : 'NULL'}, '${escape(row.slug)}', ` +
    `${Object.keys(row.facets).length > 0 ? `'${escape(JSON.stringify(row.facets))}'` : 'NULL'}) ` +
    `ON CONFLICT(id) DO UPDATE SET name_zh = excluded.name_zh, name_en = excluded.name_en, ` +
    `slug = excluded.slug, facets = excluded.facets;`,
)

console.log(`\n共 ${rows.length} 行：原神 ${rows.filter((r) => r.gameId === 'genshin').length}、星铁 ${rows.filter((r) => r.gameId === 'honkaistarrail').length}`)

if (dryRun) {
  console.log('（dry-run，未写库）示例：')
  console.log(statements.slice(0, 3).join('\n'))
} else {
  applySql(statements, '实体')
}
