/**
 * 重建某个应用本地 D1 的搜索索引（不依赖 dev server）。
 * 用法：node scripts/reindex-local.mjs apps/genshin
 *
 * 生产环境用管理接口 POST /api/admin/reindex，见 packages/api/src/admin.ts。
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { toSearchText } from '../packages/db/src/search.ts'

const appDir = resolve(process.argv[2] ?? 'apps/genshin')

function query(command) {
  const raw = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'paibook', '--local', '--json', '--command', command],
    { cwd: appDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  const start = raw.indexOf('[')
  return JSON.parse(raw.slice(start))[0].results
}

const guides = query('SELECT id, title, summary, body FROM guide;')
const escape = (value) => String(value).replaceAll("'", "''")

const values = guides
  .map((row) => `  ('${escape(row.id)}', '${escape(toSearchText(`${row.title} ${row.summary} ${row.body}`))}')`)
  .join(',\n')

const sql = `DELETE FROM guide_fts;\nINSERT INTO guide_fts (guide_id, text) VALUES\n${values};\n`
const file = join(mkdtempSync(join(tmpdir(), 'pb-reindex-')), 'reindex.sql')
writeFileSync(file, sql)

execFileSync('npx', ['wrangler', 'd1', 'execute', 'paibook', '--local', '--file', file], {
  cwd: appDir,
  stdio: ['ignore', 'ignore', 'pipe'],
})

console.log(`${appDir.split('/').pop()}: 已重建 ${guides.length} 篇的索引`)
