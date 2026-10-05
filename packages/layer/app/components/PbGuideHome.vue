<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { GuideLink, GuideSummary } from '@paibook/contracts'

const props = defineProps<{
  guides: GuideSummary[]
  total: number
  links: GuideLink[]
}>()

const { entityIds, enabled, ready, load, persist } = useProfile()

onMounted(load)

const visibleGuides = computed(() =>
  enabled.value && entityIds.value.length > 0
    ? props.guides.filter((guide) => matchesProfile(guide.entities.map((entity) => entity.id), entityIds.value))
    : props.guides,
)

const hidden = computed(() => props.guides.length - visibleGuides.value.length)
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">全部攻略</h1>
    <p class="pb-muted count">
      共 {{ total }} 篇<template v-if="ready && entityIds.length">（已按我的档案过滤）</template>
    </p>

    <p v-if="ready && entityIds.length" class="filter">
      <label class="filter__label">
        <input v-model="enabled" type="checkbox" @change="persist()" />
        只看与我相关的条目
      </label>
      <span v-if="enabled && hidden > 0" class="pb-muted filter__hint">已隐藏 {{ hidden }} 篇</span>
      <NuxtLink class="filter__link" to="/profile">编辑档案</NuxtLink>
    </p>

    <div class="list">
      <PbGuideCard v-for="guide in visibleGuides" :key="guide.id" :guide="guide" />
    </div>

    <p v-if="ready && enabled && entityIds.length && visibleGuides.length === 0" class="pb-muted empty">
      你选中的实体还没有对应攻略——把过滤关掉就能看到全部 {{ total }} 篇。
    </p>

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
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pb-space-3);
  margin: 0 0 var(--pb-space-4);
  font-size: 13px;
}
.filter__label {
  display: inline-flex;
  align-items: center;
  gap: var(--pb-space-1);
  cursor: pointer;
}
.filter__link {
  color: var(--pb-accent-ink);
  text-underline-offset: 3px;
}
.list {
  display: grid;
  gap: var(--pb-space-3);
}
.empty {
  margin: var(--pb-space-3) 0 0;
  font-size: 13px;
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
