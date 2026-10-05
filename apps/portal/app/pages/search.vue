<script setup lang="ts">
import type { GuideSummary } from '@paibook/contracts'

const route = useRoute()
const query = computed(() => String(route.query.q ?? '').trim())

const [{ data }, { data: games }] = await Promise.all([
  useFetch<{ items: GuideSummary[]; total: number }>('/api/search', { query: { q: query } }),
  useFetch<{ items: { id: string; titleZh: string }[] }>('/api/games'),
])

const titleOf = (id: string) => games.value?.items.find((game) => game.id === id)?.titleZh ?? id

useHead({ title: '搜索 · PaiBook' })
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">全站搜索</h1>

    <form class="form" action="/search" method="get">
      <input class="form__input" type="search" name="q" :value="query" placeholder="在三款游戏里搜索攻略" />
      <button class="pb-btn pb-btn--primary" type="submit">搜索</button>
    </form>

    <p v-if="query" class="pb-muted count">“{{ query }}” 找到 {{ data?.total ?? 0 }} 篇</p>
    <p v-else class="pb-muted count">输入关键词开始搜索。</p>

    <ul class="list">
      <li v-for="guide in data?.items ?? []" :key="guide.id" class="item pb-panel">
        <NuxtLink class="item__link" :to="`/${guide.gameId}/guides/${guide.slug}`">
          <span class="item__title">{{ guide.title }}</span>
          <span class="pb-muted item__summary">{{ guide.summary }}</span>
        </NuxtLink>
        <span class="pb-badge">{{ titleOf(guide.gameId) }}</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.form {
  display: flex;
  gap: var(--pb-space-2);
  margin-bottom: var(--pb-space-3);
}
.form__input {
  flex: 1;
  padding: var(--pb-space-2);
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 14px;
}
.count {
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--pb-space-2);
}
.item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pb-space-2);
  padding: var(--pb-space-3);
}
.item__link {
  color: inherit;
  text-decoration: none;
}
.item__link:hover .item__title {
  color: var(--pb-accent-ink);
}
.item__title {
  display: block;
  font-weight: 600;
}
.item__summary {
  display: block;
  margin-top: var(--pb-space-1);
  font-size: 13px;
}
</style>
