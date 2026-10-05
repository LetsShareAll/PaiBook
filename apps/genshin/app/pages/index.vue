<script setup lang="ts">
import type { GuideList } from '@paibook/contracts'

const { data: list } = await useFetch<GuideList>('/api/guides')
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">派蒙的应急手册 · 提瓦特篇</h1>
    <p class="pb-muted">共 {{ list?.total ?? 0 }} 篇攻略</p>

    <ul class="guide-list">
      <li v-for="guide in list?.items ?? []" :key="guide.id" class="guide-item">
        <NuxtLink class="guide-link" :to="`/guides/${guide.slug}`">{{ guide.title }}</NuxtLink>
        <span v-if="guide.version" class="pb-badge">{{ guide.version.label }}</span>
        <p class="pb-muted guide-summary">{{ guide.summary }}</p>
        <p v-if="guide.entities.length" class="pb-muted guide-entities">
          {{ guide.entities.map((entity) => entity.nameZh).join(' · ') }}
        </p>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.guide-list {
  list-style: none;
  padding: 0;
  margin: var(--pb-space-4) 0 0;
  display: grid;
  gap: var(--pb-space-3);
}
.guide-item {
  border: var(--pb-line);
  border-radius: var(--pb-radius-md);
  padding: var(--pb-space-3);
  background: var(--pb-surface);
}
.guide-link {
  font-size: 18px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}
.guide-link:hover {
  color: var(--pb-accent);
}
.guide-summary {
  margin: var(--pb-space-1) 0 0;
}
.guide-entities {
  margin: var(--pb-space-1) 0 0;
  font-size: 14px;
}
</style>
