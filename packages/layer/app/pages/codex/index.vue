<script setup lang="ts">
import type { Entity } from '@paibook/contracts'

/**
 * 图鉴列表：本游戏的全部实体 + 分类筛选。
 * 分类词表统一为 element / class / rarity / faction（见 contracts/entity.ts），
 * 三款游戏各自有哪些键、键里有哪些值，都由数据决定，页面不写死。
 */
const FACET_LABELS: Record<string, string> = {
  element: '元素',
  class: '职业',
  rarity: '稀有度',
  faction: '所属',
}
const FACET_ORDER = ['element', 'class', 'rarity', 'faction']

const { data } = await useFetch<{ items: Entity[]; total: number }>(apiUrl('/api/codex'))

useHead({ title: '图鉴 · PaiBook' })

const keyword = ref('')
const picked = ref<Record<string, string>>({})

/** 每个 facet 键有哪些取值、各多少个——由数据推出来，不维护词表。 */
const facets = computed(() => {
  const map = new Map<string, Map<string, number>>()
  for (const item of data.value?.items ?? []) {
    for (const [key, value] of Object.entries(item.facets)) {
      const bucket = map.get(key) ?? new Map<string, number>()
      bucket.set(value, (bucket.get(value) ?? 0) + 1)
      map.set(key, bucket)
    }
  }
  return [...map.entries()]
    .sort((a, b) => {
      const ai = FACET_ORDER.indexOf(a[0])
      const bi = FACET_ORDER.indexOf(b[0])
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    })
    .map(([key, bucket]) => ({
      key,
      label: FACET_LABELS[key] ?? key,
      values: [...bucket.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN'))
        .map(([value, count]) => ({ value, count })),
    }))
})

const items = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return (data.value?.items ?? []).filter((item) => {
    for (const [key, value] of Object.entries(picked.value)) {
      if (value && item.facets[key] !== value) return false
    }
    if (!q) return true
    return item.nameZh.toLowerCase().includes(q) || (item.nameEn ?? '').toLowerCase().includes(q)
  })
})

const filtering = computed(() => keyword.value.trim().length > 0 || Object.values(picked.value).some(Boolean))

function toggle(key: string, value: string) {
  picked.value = { ...picked.value, [key]: picked.value[key] === value ? '' : value }
}

function reset() {
  keyword.value = ''
  picked.value = {}
}
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">图鉴</h1>
    <p class="pb-muted lead">
      共 {{ data?.total ?? 0 }} 个条目<span v-if="filtering">，当前显示 {{ items.length }} 个</span>。
    </p>

    <input v-model="keyword" class="search" type="search" placeholder="搜名字（中 / 英）" />

    <div v-for="facet in facets" :key="facet.key" class="facet">
      <span class="facet__label">{{ facet.label }}</span>
      <button
        v-for="option in facet.values"
        :key="option.value"
        type="button"
        class="facet__chip"
        :class="{ 'facet__chip--on': picked[facet.key] === option.value }"
        @click="toggle(facet.key, option.value)"
      >
        {{ option.value }}<span class="facet__count">{{ option.count }}</span>
      </button>
    </div>

    <p v-if="filtering" class="reset">
      <button type="button" class="pb-btn pb-btn--ghost" @click="reset">清除筛选</button>
    </p>

    <div v-if="items.length" class="grid">
      <NuxtLink v-for="item in items" :key="item.id" class="card pb-panel" :to="`/codex/${item.slug}`">
        <p class="card__name">{{ item.nameZh }}</p>
        <p v-if="item.nameEn" class="card__en pb-muted">{{ item.nameEn }}</p>
        <p class="card__facets">
          <span v-for="(value, key) in item.facets" :key="key" class="pb-badge">{{ value }}</span>
        </p>
      </NuxtLink>
    </div>
    <p v-else class="pb-muted empty">
      {{ (data?.total ?? 0) === 0 ? '这个游戏的图鉴还没开始录入。' : '没有符合条件的条目。' }}
    </p>
  </main>
</template>

<style scoped>
.lead {
  margin: 0 0 var(--pb-space-3);
}
.search {
  width: 100%;
  max-width: 360px;
  padding: var(--pb-space-2) var(--pb-space-3);
  color: var(--pb-ink);
  background: var(--pb-surface);
  border: var(--pb-border-width) solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
}
.facet {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pb-space-1);
  align-items: center;
  margin-top: var(--pb-space-3);
}
.facet__label {
  min-width: 48px;
  color: var(--pb-muted);
  font-size: 12px;
}
.facet__chip {
  padding: 3px 10px;
  color: var(--pb-ink);
  cursor: pointer;
  background: var(--pb-surface);
  border: var(--pb-border-width) solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  font-size: 13px;
}
.facet__chip:hover {
  border-color: var(--pb-accent);
}
.facet__chip--on {
  color: var(--pb-accent-foreground);
  background: var(--pb-accent-soft);
  border-color: var(--pb-accent);
}
.facet__count {
  margin-left: 6px;
  color: var(--pb-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.reset {
  margin: var(--pb-space-3) 0 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--pb-space-2);
  margin-top: var(--pb-space-4);
}
.card {
  display: block;
  padding: var(--pb-space-3);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease;
}
.card:hover {
  border-color: var(--pb-accent);
}
.card__name {
  margin: 0;
  font-family: var(--pb-font-display);
  font-size: 18px;
  font-weight: 700;
}
.card__en {
  margin: 2px 0 0;
  font-size: 12px;
}
.card__facets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: var(--pb-space-2) 0 0;
}
.empty {
  margin-top: var(--pb-space-4);
}
</style>
