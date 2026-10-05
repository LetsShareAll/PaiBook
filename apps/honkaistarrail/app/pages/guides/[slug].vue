<script setup lang="ts">
import type { GuideDetail } from '@paibook/contracts'

const route = useRoute()
const { data: guide } = await useFetch<GuideDetail>(apiUrl(`/api/guides/${route.params.slug}`))

if (!guide.value) {
  throw createError({ statusCode: 404, message: '这篇攻略不存在', fatal: true })
}

useHead({
  title: `${guide.value.title} · PaiBook`,
  meta: [{ name: 'description', content: guide.value.summary }],
})
</script>

<template>
  <main v-if="guide" class="pb-shell">
    <NuxtLink class="back" to="/">← 全部攻略</NuxtLink>

    <header class="head">
      <h1 class="pb-title">{{ guide.title }}</h1>
      <p class="meta">
        <span v-if="guide.version" class="pb-badge">{{ guide.version.label }}</span>
        <span v-if="guide.publishedAt" class="pb-muted date">{{ guide.publishedAt.slice(0, 10) }}</span>
      </p>
      <p v-if="guide.entities.length" class="pb-muted entities">
        <template v-for="(entity, index) in guide.entities" :key="entity.id">
          <span v-if="index > 0" class="pb-dot">◆</span>{{ entity.nameZh }}
        </template>
      </p>
    </header>

    <article class="pb-panel body">
      <p class="summary">{{ guide.summary }}</p>
      <PbProse class="prose" :markdown="guide.body" />
    </article>
  </main>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: var(--pb-space-3);
  color: var(--pb-muted);
  text-decoration: none;
  font-size: 14px;
}
.back:hover {
  color: var(--pb-accent-ink);
}
.head {
  margin-bottom: var(--pb-space-4);
}
.meta {
  display: flex;
  align-items: center;
  gap: var(--pb-space-2);
  margin: var(--pb-space-2) 0 0;
}
.date {
  font-size: 12px;
}
.entities {
  margin: var(--pb-space-2) 0 0;
  font-size: 13px;
}
.body {
  padding: var(--pb-space-4);
}
.summary {
  margin: 0;
  padding-bottom: var(--pb-space-3);
  border-bottom: 1px solid var(--pb-edge);
  color: var(--pb-muted);
}
.prose {
  margin-top: var(--pb-space-4);
}
</style>
