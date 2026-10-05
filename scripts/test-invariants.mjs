/**
 * 核心不变量回归测试。对本地 dev server 或线上地址都能跑：
 *   node scripts/test-invariants.mjs [基地址]     默认 http://localhost:4123/genshin
 * 管理员密码从 ADMIN_PASSWORD 读，默认 dev-password（与 .dev.vars 一致）。
 *
 * 这些不变量是"最怕被以后改坏"的东西：
 *   1. 草稿绝不出现在前台列表、详情页与搜索结果里
 *   2. 发布后立刻可见（本地 dev；边缘缓存那条要在生产产物上验，见 docs/adr/0002）
 *   3. 后台接口必须上锁
 *   4. 中文两字词必须搜得到
 *   5. 实体重复要被挡住；删实体不能连坐删掉攻略
 */
const base = (process.argv[2] ?? 'http://localhost:4123/genshin').replace(/\/$/, '')
const password = process.env.ADMIN_PASSWORD ?? 'dev-password'
const stamp = Date.now().toString().slice(-6)
const uniqueWord = `体检${stamp.slice(-2)}` // 两字中文词，专门用来戳 FTS 的分词
const slug = `itest-${stamp}`
const draftSlug = `itest-draft-${stamp}`

let cookie = ''
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail && !ok ? `  ← ${detail}` : ''}`)
}

async function call(path, init = {}) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
  })
}

const created = { guides: [], entities: [] }

async function createGuide(payload) {
  const res = await call('/api/admin/guides', { method: 'POST', body: JSON.stringify(payload) })
  const body = await res.json().catch(() => ({}))
  if (body.id) created.guides.push(body.id)
  return { res, body }
}

// --- 0. 站点得先活着：报错要能看懂，而不是抛一堆栈 ---
const health = await fetch(`${base}/api/health`).catch(() => null)
if (!health || !health.ok) {
  console.error(`连不上 ${base}/api/health —— 站点没起来，或者地址不对。`)
  process.exit(1)
}

// --- 1. 上锁 ---
check('未登录读后台接口返回 401', (await call('/api/admin/guides')).status === 401)
check('未登录删后台内容返回 401', (await call('/api/admin/links')).status === 401)

const badLogin = await fetch(`${base}/api/admin/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ password: 'definitely-wrong' }),
})
check('错误密码返回 401', badLogin.status === 401)

const login = await fetch(`${base}/api/admin/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ password }),
})
check('正确密码拿到会话 cookie', login.status === 200 && login.headers.getSetCookie().length > 0)
cookie = login.headers
  .getSetCookie()
  .map((item) => item.split(';')[0])
  .join('; ')

// --- 2. 草稿不变量 ---
const draft = await createGuide({
  title: `体检草稿 ${uniqueWord}`,
  slug: draftSlug,
  summary: '测试用草稿，不应出现在任何公开位置。',
  body: `## ${uniqueWord}\n\n草稿正文。`,
  versionId: null,
  entityIds: [],
})
check('创建草稿返回 id', Boolean(draft.body.id))

const publicList = await (await fetch(`${base}/api/guides`)).json()
check('草稿不在公开列表里', !publicList.items.some((item) => item.slug === draftSlug))
check('草稿详情页 404', (await fetch(`${base}/guides/${draftSlug}`)).status === 404)
const draftSearch = await (await fetch(`${base}/api/search?q=${encodeURIComponent(uniqueWord)}`)).json()
check('草稿搜不到', draftSearch.total === 0, `total=${draftSearch.total}`)

// --- 3. 发布后立即可见 ---
const published = await createGuide({
  title: `体检攻略 ${uniqueWord}`,
  slug,
  summary: '测试用条目，跑完会删掉。',
  body: `## ${uniqueWord}\n\n正文段落。`,
  versionId: null,
  entityIds: [],
})
check('创建待发布条目返回 id', Boolean(published.body.id))
const publish = await call(`/api/admin/guides/${published.body.id}/status`, {
  method: 'POST',
  body: JSON.stringify({ status: 'published' }),
})
check('发布接口返回 published', (await publish.json()).status === 'published')

const afterPublish = await (await fetch(`${base}/api/guides`)).json()
check('发布后出现在公开列表', afterPublish.items.some((item) => item.slug === slug))
const detail = await fetch(`${base}/guides/${slug}`)
const detailHtml = await detail.text()
check('发布后详情页 200', detail.status === 200)
check('详情页包含标题', detailHtml.includes(`体检攻略 ${uniqueWord}`))

// --- 4. 中文两字词搜索 ---
const hit = await (await fetch(`${base}/api/search?q=${encodeURIComponent(uniqueWord)}`)).json()
check('两字中文词能搜到已发布条目', hit.items.some((item) => item.slug === slug), `total=${hit.total}`)

// --- 5. 实体的重复与删除 ---
const entityCreate = await call('/api/admin/entities', {
  method: 'POST',
  body: JSON.stringify({ kind: 'character', nameZh: `体检角色${stamp}`, nameEn: null }),
})
const entityBody = await entityCreate.json()
check('创建实体返回 id', Boolean(entityBody.id))
if (entityBody.id) created.entities.push(entityBody.id)

const duplicate = await call('/api/admin/entities', {
  method: 'POST',
  body: JSON.stringify({ kind: 'character', nameZh: `体检角色${stamp}`, nameEn: null }),
})
check('同名同类型实体被挡住（409）', duplicate.status === 409, `status=${duplicate.status}`)

if (entityBody.id) {
  const bound = await createGuide({
    title: `体检攻略（绑定实体）${uniqueWord}`,
    slug: `${slug}-bound`,
    summary: '用来验证删除实体不会连坐删攻略。',
    body: '正文。',
    versionId: null,
    entityIds: [entityBody.id],
  })
  const removed = await call(`/api/admin/entities/${entityBody.id}`, { method: 'DELETE' })
  const removedBody = await removed.json()
  check('删除实体回报受影响攻略数', removedBody.guides >= 1, JSON.stringify(removedBody))
  if (bound.body.id) {
    const stillThere = await call(`/api/admin/guides/${bound.body.id}`)
    check('攻略本体没有被连坐删除', stillThere.status === 200, `status=${stillThere.status}`)
  }
}

// --- 6. 清理：删掉测试条目后，前台与搜索都应干净 ---
for (const id of created.guides) {
  await call(`/api/admin/guides/${id}`, { method: 'DELETE' })
}
const finalList = await (await fetch(`${base}/api/guides`)).json()
check('清理后测试条目不在公开列表', !finalList.items.some((item) => item.slug.startsWith('itest-')))
const finalSearch = await (await fetch(`${base}/api/search?q=${encodeURIComponent(uniqueWord)}`)).json()
check('清理后搜索不到测试词', finalSearch.total === 0, `total=${finalSearch.total}`)

const failed = results.filter((item) => !item.ok)
console.log(`\n${results.length - failed.length}/${results.length} 通过`)
process.exit(failed.length === 0 ? 0 : 1)
