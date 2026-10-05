<script setup lang="ts">
import type { GuideLink, GuideSummary } from '@paibook/contracts'

defineProps<{
  guides: GuideSummary[]
  total: number
  links: GuideLink[]
}>()
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">全部攻略</h1>
    <p class="pb-muted count">共 {{ total }} 篇</p>

    <div class="list">
      <PbGuideCard v-for="guide in guides" :key="guide.id" :guide="guide" />
    </div>

    <section v-if="links.length" class="links">
      <h2 class="section">站外推荐</h2>
      <p class="pb-muted hint">下面这些是别处的攻略，点出去看原文——本站只做推荐，不搬运正文。</p>

      <ul class="link-list">
        <li v-for="item in links" :key="item.id" class="link-item pb-panel">
          <a class="link-item__title" :href="item.url" target="_blank" rel="noopener noreferrer">
            {{ item.title }}
          </a>
          <p class="pb-muted link-item__meta">
            <span v-if="item.author">{{ item.author }}</span>
            <span v-if="item.author && item.sourceName" class="pb-dot">◆</span>
            <span v-if="item.sourceName">{{ item.sourceName }}</span>
          </p>
          <p v-if="item.summary" class="link-item__summary">{{ item.summary }}</p>
          <p v-if="item.entities.length" class="pb-muted link-item__entities">
            <template v-for="(entity, index) in item.entities" :key="entity.id">
              <span v-if="index > 0" class="pb-dot">◆</span>{{ entity.nameZh }}
            </template>
          </p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.count {
  margin: 0 0 var(--pb-space-4);
  font-size: 13px;
}
.list {
  display: grid;
  gap: var(--pb-space-3);
}
.links {
  margin-top: var(--pb-space-5);
}
.section {
  font-family: var(--pb-font-display);
  font-size: 18px;
  margin: 0 0 var(--pb-space-2);
}
.hint {
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--pb-space-2);
}
.link-item {
  padding: var(--pb-space-3);
}
.link-item__title {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--pb-accent);
}
.link-item__title:hover {
  color: var(--pb-accent-ink);
}
.link-item__meta {
  display: flex;
  align-items: center;
  margin: var(--pb-space-1) 0 0;
  font-size: 12px;
}
.link-item__summary {
  margin: var(--pb-space-2) 0 0;
  font-size: 14px;
}
.link-item__entities {
  margin: var(--pb-space-1) 0 0;
  font-size: 12px;
}
</style>
