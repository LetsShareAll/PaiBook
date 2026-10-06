<script setup lang="ts">
import type { Entity, EntityRef, GuideSummary } from '@paibook/contracts'

/**
 * 原型（一次性代码）：实体挂载页——一个角色，和挂在它身上的攻略。
 * 三个变体用 ?variant=A|B|C 切换，底部浮条可翻（← → 键也行）。
 *
 * 三个变体的布局、信息层级和主操作都不一样，不是同一套骨架换配色：
 *   A 档案双栏 —— 左档案卡、右列表按版本分组，主操作是「进入某一篇」
 *   B 意图分组 —— 按"你想干什么"分块，主操作是「说出意图」
 *   C 密集索引 —— 单栏紧凑表格，主操作是「扫读」
 *
 * 数据：实体来自本地 API（genshin-db / StarRailRes 导入的真实角色）；攻略是夹具——
 * 本地库里每个站只有两条示例攻略，撑不出真实密度，而这次要评的正是密度。
 * 夹具文案刻意写成与游戏无关的通用说法，这样三个站都能用同一套。
 */
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const VARIANTS = [
  { key: 'A', name: '档案双栏' },
  { key: 'B', name: '意图分组' },
  { key: 'C', name: '密集索引' },
]
const BUCKET_ORDER = ['入门', '养成', '配队', '高难']
const BUCKET_BLURB: Record<string, string> = {
  入门: '刚抽到，先判断要不要练。',
  养成: '材料、天赋、武器、命座——钱花在哪。',
  配队: '和谁一起上，在队里干什么活。',
  高难: '高难副本与限时活动里的具体打法。',
}

/** 优先展示这个实体；别的站点没有它时，退回该站第一个实体。 */
const HERO_ID = 'genshin:character:qiqi'

/** 夹具版本号按游戏取，免得绝区零的页面上出现 5.2 这种不属于它的版本。 */
const VERSIONS: Record<string, string[]> = {
  genshin: ['5.2', '5.1', '5.0', '4.8', '4.7'],
  honkaistarrail: ['4.6', '4.5', '4.4', '4.2', '4.1'],
  zenlesszonezero: ['3.2', '3.1', '3.0', '2.8', '2.7'],
}

const route = useRoute()

const variant = computed(() => {
  const raw = String(route.query.variant ?? 'A').toUpperCase()
  return VARIANTS.some((v) => v.key === raw) ? raw : 'A'
})

function setVariant(key: string) {
  navigateTo({ query: { ...route.query, variant: key } }, { replace: true })
}

const [{ data: entityData }, { data: guideData }] = await Promise.all([
  useFetch<{ items: Entity[] }>(apiUrl('/api/entities')),
  useFetch<{ items: GuideSummary[] }>(apiUrl('/api/guides')),
])

const hero = computed<Entity | null>(
  () => entityData.value?.items.find((e) => e.id === HERO_ID) ?? entityData.value?.items[0] ?? null,
)

/** 夹具：形状与 GuideSummary 完全一致，接上真数据时删掉这段即可。 */
const RAW = [
  { slug: 'first-week', v: 0, day: '2026-09-30', bucket: '入门', title: '从零开始练{name}：第一周做这三件事', summary: '先做什么、什么可以往后放，一次说清。' },
  { slug: 'worth-it', v: 0, day: '2026-09-12', bucket: '入门', title: '抽到{name}要不要练？先看这两个前提', summary: '不是所有队伍都需要他，先说判断标准。' },
  { slug: 'invest-priority', v: 0, day: '2026-09-28', bucket: '养成', title: '「{name}」养成优先级：装备、天赋与技能怎么选', summary: '三条线各自的钱该怎么花，哪条可以先放着。' },
  { slug: 'constellation', v: 3, day: '2026-07-16', bucket: '养成', title: '{name}命座收益表：几命开始值得投', summary: '逐命拆开算，哪些是质变、哪些只是数字。' },
  { slug: 'materials', v: 0, day: '2026-09-20', bucket: '养成', title: '{name}突破材料路线：每天该刷哪些本', summary: '按天排的路线，省掉来回查表。' },
  { slug: 'weapon', v: 4, day: '2026-06-30', bucket: '养成', title: '{name}武器取舍：两把四星的实际差别', summary: '什么时候其实无所谓。' },
  { slug: 'talent-order', v: 2, day: '2026-08-11', bucket: '养成', title: '{name}天赋升级顺序与预算', summary: '先点哪个、点到几级停手。' },
  { slug: 'main-or-sub', v: 1, day: '2026-08-26', bucket: '配队', title: '{name}当主奶还是副奶？两套配队思路对比', summary: '两种定位的站场时间与队友要求完全不同。' },
  { slug: 'who-splits-what', v: 2, day: '2026-08-04', bucket: '配队', title: '队伍里{name}和谁分工', summary: '功能不能兼得时怎么选。' },
  { slug: 'resonance', v: 1, day: '2026-09-02', bucket: '配队', title: '双元素共鸣下的{name}配装', summary: '共鸣一开，词条的优先级会变。' },
  { slug: 'hard-mode', v: 0, day: '2026-10-02', bucket: '高难', title: '高难副本：{name}的生存轴怎么排', summary: '把资源压在哪些波次，能省下一次重开。' },
  { slug: 'event-survival', v: 0, day: '2026-09-25', bucket: '高难', title: '限时活动高难：靠{name}硬吃的两套打法', summary: '不追求速通时的稳妥解。' },
]

const items = computed(() => {
  const h = hero.value
  if (!h) return []

  const ref: EntityRef = { id: h.id, kind: h.kind, nameZh: h.nameZh }
  const labels = VERSIONS[h.gameId] ?? VERSIONS.genshin!
  const fixtures = RAW.map((raw) => {
    const label = labels[raw.v] ?? labels[0]!
    const guide: GuideSummary = {
      id: `proto:${h.gameId}:${raw.slug}`,
      gameId: h.gameId,
      slug: raw.slug,
      title: raw.title.replaceAll('{name}', h.nameZh),
      summary: raw.summary,
      version: { id: `${h.gameId}:${label}`, label },
      entities: [ref],
      publishedAt: `${raw.day}T00:00:00Z`,
    }
    return { bucket: raw.bucket, guide }
  })

  const real = (guideData.value?.items ?? [])
    .filter((g) => g.entities.some((e) => e.id === h.id))
    .map((guide) => ({ bucket: '养成', guide }))

  return [...real, ...fixtures]
})

const guides = computed(() => items.value.map((i) => i.guide))

const versionGroups = computed(() => {
  const map = new Map<string, GuideSummary[]>()
  for (const { guide } of items.value) {
    const label = guide.version?.label ?? '未标注版本'
    const bucket = map.get(label) ?? []
    bucket.push(guide)
    map.set(label, bucket)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0], 'zh-Hans-CN', { numeric: true }))
    .map(([label, list]) => ({ label, list }))
})

const buckets = computed(() =>
  BUCKET_ORDER.map((name) => ({
    name,
    guides: items.value.filter((i) => i.bucket === name).map((i) => i.guide),
  })).filter((b) => b.guides.length > 0),
)

const versionCount = computed(() => versionGroups.value.length)
</script>

<template>
  <main class="pb-shell proto">
    <p class="proto__flag">原型 · 实体挂载页 · 变体 {{ variant }} · 攻略为夹具数据</p>

    <!-- A 档案双栏：左档案、右按版本分组的列表 -->
    <div v-if="variant === 'A'" class="a">
      <aside class="a__side pb-panel">
        <p class="a__kind">{{ hero?.kind ?? 'character' }}</p>
        <h1 class="a__name">{{ hero?.nameZh ?? '—' }}</h1>
        <p v-if="hero?.nameEn" class="a__en pb-muted">{{ hero.nameEn }}</p>
        <dl class="a__stats">
          <div><dt>攻略</dt><dd>{{ guides.length }}</dd></div>
          <div><dt>覆盖版本</dt><dd>{{ versionCount }}</dd></div>
        </dl>
      </aside>

      <div class="a__main">
        <section v-for="group in versionGroups" :key="group.label" class="a__group">
          <h2 class="a__groupTitle">{{ group.label }}</h2>
          <ul class="a__list">
            <li v-for="guide in group.list" :key="guide.id" class="a__item pb-panel">
              <NuxtLink class="a__title" :to="`/guides/${guide.slug}`">{{ guide.title }}</NuxtLink>
              <p class="a__summary pb-muted">{{ guide.summary }}</p>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- B 意图分组：先问你想干什么 -->
    <div v-else-if="variant === 'B'" class="b">
      <header class="b__head">
        <h1 class="b__name">{{ hero?.nameZh ?? '—' }}</h1>
        <p class="b__meta pb-muted">{{ guides.length }} 篇攻略 · 覆盖 {{ versionCount }} 个版本</p>
      </header>

      <div class="b__grid">
        <section v-for="bucket in buckets" :key="bucket.name" class="b__bucket">
          <h2 class="b__bucketTitle">{{ bucket.name }}</h2>
          <p class="b__blurb pb-muted">{{ BUCKET_BLURB[bucket.name] }}</p>
          <ul class="b__links">
            <li v-for="guide in bucket.guides" :key="guide.id">
              <NuxtLink class="b__link" :to="`/guides/${guide.slug}`">{{ guide.title }}</NuxtLink>
              <span class="b__ver pb-muted">{{ guide.version?.label }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- C 密集索引：一屏扫完 -->
    <div v-else class="c">
      <header class="c__head">
        <h1 class="c__name">{{ hero?.nameZh ?? '—' }}</h1>
        <p class="c__meta pb-muted">
          {{ hero?.kind ?? 'character' }} · {{ guides.length }} 篇 · {{ versionCount }} 个版本
        </p>
      </header>

      <table class="c__table">
        <thead>
          <tr>
            <th class="c__th c__th--title">标题</th>
            <th class="c__th">分组</th>
            <th class="c__th">版本</th>
            <th class="c__th c__th--date">更新</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.guide.id" class="c__row">
            <td class="c__td c__td--title">
              <NuxtLink class="c__link" :to="`/guides/${row.guide.slug}`">{{ row.guide.title }}</NuxtLink>
            </td>
            <td class="c__td c__td--dim">{{ row.bucket }}</td>
            <td class="c__td c__td--dim">{{ row.guide.version?.label }}</td>
            <td class="c__td c__td--dim c__td--date">{{ row.guide.publishedAt?.slice(0, 10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PbPrototypeSwitcher :variants="VARIANTS" :current="variant" @change="setVariant" />
  </main>
</template>

<style scoped>
.proto__flag {
  margin: 0 0 var(--pb-space-4);
  color: var(--pb-muted);
  font-family: var(--pb-font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
}

/* --- A 档案双栏 --- */
.a {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--pb-space-5);
  align-items: start;
}
.a__side {
  padding: var(--pb-space-4);
  border-top: 3px solid var(--pb-accent);
}
.a__kind {
  margin: 0;
  color: var(--pb-muted);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.a__name {
  margin: var(--pb-space-1) 0 0;
  font-family: var(--pb-font-display);
  font-size: 34px;
  letter-spacing: -0.02em;
}
.a__en {
  margin: 2px 0 0;
  font-size: 13px;
}
.a__stats {
  display: flex;
  gap: var(--pb-space-4);
  margin: var(--pb-space-4) 0 0;
  padding-top: var(--pb-space-3);
  border-top: 1px solid var(--pb-edge);
}
.a__stats dt {
  color: var(--pb-muted);
  font-size: 12px;
}
.a__stats dd {
  margin: 2px 0 0;
  font-size: 20px;
}
.a__group + .a__group {
  margin-top: var(--pb-space-5);
}
.a__groupTitle {
  margin: 0 0 var(--pb-space-3);
  padding-bottom: var(--pb-space-2);
  border-bottom: 1px solid var(--pb-edge);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.a__list {
  display: grid;
  gap: var(--pb-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.a__item {
  padding: var(--pb-space-3);
}
.a__title {
  color: inherit;
  text-decoration: none;
  font-size: 17px;
}
.a__title:hover {
  color: var(--pb-accent-foreground);
}
.a__summary {
  margin: var(--pb-space-1) 0 0;
  font-size: 13px;
}

/* --- B 意图分组 --- */
.b__head {
  display: flex;
  gap: var(--pb-space-3);
  align-items: baseline;
  padding-bottom: var(--pb-space-3);
  border-bottom: 2px solid var(--pb-edge);
}
.b__name {
  margin: 0;
  font-family: var(--pb-font-display);
  font-size: 30px;
}
.b__meta {
  margin: 0;
  font-size: 13px;
}
.b__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pb-space-5) var(--pb-space-5);
  margin-top: var(--pb-space-5);
}
.b__bucketTitle {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.02em;
}
.b__blurb {
  margin: var(--pb-space-1) 0 var(--pb-space-3);
  font-size: 13px;
}
.b__links {
  margin: 0;
  padding: 0;
  list-style: none;
}
.b__links li {
  display: flex;
  gap: var(--pb-space-2);
  align-items: baseline;
  justify-content: space-between;
  padding: var(--pb-space-2) 0;
  border-top: 1px solid var(--pb-edge);
}
.b__link {
  color: inherit;
  text-decoration: none;
}
.b__link:hover {
  color: var(--pb-accent-foreground);
}
.b__ver {
  flex: none;
  font-size: 12px;
}

/* --- C 密集索引 --- */
.c__head {
  display: flex;
  gap: var(--pb-space-3);
  align-items: baseline;
  margin-bottom: var(--pb-space-3);
}
.c__name {
  margin: 0;
  font-family: var(--pb-font-display);
  font-size: 26px;
}
.c__meta {
  margin: 0;
  font-size: 13px;
}
.c__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.c__th {
  padding: var(--pb-space-2) var(--pb-space-2);
  border-bottom: 2px solid var(--pb-edge);
  color: var(--pb-muted);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}
.c__th--title {
  width: 58%;
}
.c__th--date {
  text-align: right;
}
.c__td {
  padding: var(--pb-space-2) var(--pb-space-2);
  border-bottom: 1px solid var(--pb-edge);
  vertical-align: baseline;
}
.c__td--dim {
  color: var(--pb-muted);
  font-size: 12px;
  white-space: nowrap;
}
.c__td--date {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.c__row:hover .c__td {
  background: var(--pb-surface-alt);
}
.c__link {
  color: inherit;
  text-decoration: none;
}
.c__link:hover {
  color: var(--pb-accent-foreground);
}
</style>
