<script setup lang="ts">
import type { GuideSummary } from '@paibook/contracts'

const route = useRoute()
const query = computed(() => String(route.query.q ?? '').trim())

const { data } = await useFetch<{ items: GuideSummary[]; total: number }>(apiUrl('/api/search'), {
  query: { q: query },
})

useHead({ title: '搜索 · PaiBook' })
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">搜索</h1>

    <form class="form" :action="apiUrl('/search')" method="get">
      <input class="form__input" type="search" name="q" :value="query" placeholder="输入角色名、玩法或关键词" />
      <button class="pb-btn pb-btn--primary" type="submit">搜索</button>
    </form>

    <p v-if="query" class="pb-muted count">“{{ query }}” 找到 {{ data?.total ?? 0 }} 篇</p>
    <p v-else class="pb-muted count">输入关键词开始搜索。</p>

    <div class="list">
      <PbGuideCard v-for="guide in data?.items ?? []" :key="guide.id" :guide="guide" />
    </div>
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
.form__input:focus {
  outline: 2px solid var(--pb-accent);
  outline-offset: -1px;
}
.count {
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.list {
  display: grid;
  gap: var(--pb-space-3);
}
</style>
