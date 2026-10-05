<script setup lang="ts">
import type { GuideDetail } from '@paibook/contracts'

const route = useRoute()
const { data: guide } = await useFetch<GuideDetail>(`/api/guides/${route.params.slug}`)

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
    <NuxtLink class="pb-muted back" to="/">← 全部攻略</NuxtLink>
    <h1 class="pb-title">{{ guide.title }}</h1>

    <p class="meta">
      <span v-if="guide.version" class="pb-badge">{{ guide.version.label }}</span>
      <span v-if="guide.publishedAt" class="pb-muted">{{ guide.publishedAt.slice(0, 10) }}</span>
    </p>

    <p v-if="guide.entities.length" class="pb-muted">
      {{ guide.entities.map((entity) => entity.nameZh).join(' · ') }}
    </p>

    <article class="body">{{ guide.body }}</article>
  </main>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: var(--pb-space-3);
  text-decoration: none;
  font-size: 14px;
}
.meta {
  display: flex;
  align-items: center;
  gap: var(--pb-space-2);
  margin: 0 0 var(--pb-space-2);
}
.body {
  white-space: pre-wrap;
  margin-top: var(--pb-space-4);
}
</style>
