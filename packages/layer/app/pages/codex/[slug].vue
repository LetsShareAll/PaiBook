<script setup lang="ts">
import type { CodexEntry } from '@paibook/contracts'

/**
 * 图鉴条目：这个角色的分类信息，以及挂在它身上的攻略与站外推荐。
 * 只呈现分类，不呈现数值——数值必须能追到游戏内文本或官方公告（ADR-0009），
 * 现在没有达到那条线的数据源。
 */
const route = useRoute()
const { data } = await useFetch<CodexEntry>(() => apiUrl(`/api/codex/${route.params.slug}`))

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: '图鉴里没有这个条目' })
}

useHead(() => ({ title: `${data.value?.entity.nameZh ?? '图鉴'} · PaiBook` }))

const guides = computed(() => data.value?.guides ?? [])
const links = computed(() => data.value?.links ?? [])
const versions = computed(() => {
  const labels = new Set<string>()
  for (const guide of guides.value) if (guide.version) labels.add(guide.version.label)
  return labels.size
})
</script>

<template>
  <main class="pb-shell">
    <p class="back">
      <NuxtLink class="back__link pb-muted" to="/codex">← 图鉴</NuxtLink>
    </p>

    <header v-if="data" class="head">
      <h1 class="head__name">{{ data.entity.nameZh }}</h1>
      <p v-if="data.entity.nameEn" class="head__en pb-muted">{{ data.entity.nameEn }}</p>
      <p class="head__facets">
        <span v-for="(value, key) in data.entity.facets" :key="key" class="pb-badge">{{ value }}</span>
      </p>
      <p class="head__meta pb-muted">
        {{ guides.length }} 篇攻略<span v-if="versions"> · 覆盖 {{ versions }} 个版本</span>
      </p>
    </header>

    <section v-if="guides.length" class="block">
      <h2 class="block__title">本站攻略</h2>
      <table class="table">
        <thead>
          <tr>
            <th class="table__th table__th--title">标题</th>
            <th class="table__th">版本</th>
            <th class="table__th table__th--date">更新</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="guide in guides" :key="guide.id" class="table__row">
            <td class="table__td table__td--title">
              <NuxtLink class="table__link" :to="`/guides/${guide.slug}`">{{ guide.title }}</NuxtLink>
              <p v-if="guide.summary" class="table__summary pb-muted">{{ guide.summary }}</p>
            </td>
            <td class="table__td table__td--dim">{{ guide.version?.label ?? '—' }}</td>
            <td class="table__td table__td--dim table__td--date">
              {{ guide.publishedAt?.slice(0, 10) ?? '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="links.length" class="block">
      <h2 class="block__title">站外推荐</h2>
      <ul class="links">
        <li v-for="link in links" :key="link.id" class="links__item">
          <a class="links__title" :href="link.url" rel="noopener nofollow" target="_blank">{{ link.title }}</a>
          <p v-if="link.summary" class="links__summary pb-muted">{{ link.summary }}</p>
          <p class="links__source pb-muted">
            {{ [link.sourceName, link.author].filter(Boolean).join(' · ') || '站外' }}
          </p>
        </li>
      </ul>
    </section>

    <p v-if="!guides.length && !links.length" class="pb-muted empty">
      这个条目还没有挂上任何内容。攻略写好后在写作台里挂到它身上即可。
    </p>
  </main>
</template>

<style scoped>
.back {
  margin: 0 0 var(--pb-space-3);
}
.back__link {
  text-decoration: none;
  font-size: 13px;
}
.back__link:hover {
  color: var(--pb-accent-foreground);
}
.head {
  padding-bottom: var(--pb-space-4);
  border-bottom: 2px solid var(--pb-edge);
}
.head__name {
  margin: 0;
  font-family: var(--pb-font-display);
  font-size: 34px;
  letter-spacing: -0.02em;
}
.head__en {
  margin: 2px 0 0;
  font-size: 13px;
}
.head__facets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: var(--pb-space-3) 0 0;
}
.head__meta {
  margin: var(--pb-space-2) 0 0;
  font-size: 13px;
}
.block {
  margin-top: var(--pb-space-5);
}
.block__title {
  margin: 0 0 var(--pb-space-3);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table__th {
  padding: var(--pb-space-2);
  border-bottom: 2px solid var(--pb-edge);
  color: var(--pb-muted);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}
.table__th--title {
  width: 62%;
}
.table__th--date {
  text-align: right;
}
.table__td {
  padding: var(--pb-space-2);
  border-bottom: 1px solid var(--pb-edge);
  vertical-align: baseline;
}
.table__td--dim {
  color: var(--pb-muted);
  font-size: 12px;
  white-space: nowrap;
}
.table__td--date {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.table__row:hover .table__td {
  background: var(--pb-surface-alt);
}
.table__link {
  color: inherit;
  text-decoration: none;
}
.table__link:hover {
  color: var(--pb-accent-foreground);
}
.table__summary {
  margin: 2px 0 0;
  font-size: 12px;
}
.links {
  margin: 0;
  padding: 0;
  list-style: none;
}
.links__item {
  padding: var(--pb-space-3) 0;
  border-top: 1px solid var(--pb-edge);
}
.links__title {
  color: inherit;
  text-decoration: none;
  font-size: 16px;
}
.links__title:hover {
  color: var(--pb-accent-foreground);
}
.links__summary {
  margin: var(--pb-space-1) 0 0;
  font-size: 13px;
}
.links__source {
  margin: var(--pb-space-1) 0 0;
  font-size: 12px;
}
.empty {
  margin-top: var(--pb-space-5);
}
</style>
