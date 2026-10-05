<script setup lang="ts">
import type { GuideDetail } from '@paibook/contracts'

const route = useRoute()
const { data: guide } = await useFetch<GuideDetail>(apiUrl(`/api/guides/${route.params.slug}`))

if (!guide.value) {
  throw createError({ statusCode: 404, message: '这篇攻略不存在', fatal: true })
}

useGuideSeo(guide.value)
</script>

<template>
  <main v-if="guide" class="pb-shell">
    <NuxtLink class="back" to="/">← 全部攻略</NuxtLink>
    <PbGuideArticle :guide="guide" />
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
</style>
