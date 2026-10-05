<script setup lang="ts">
import type { GuideList } from '@paibook/contracts'

const { data: list } = await useFetch<GuideList>('/api/guides')
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">全部攻略</h1>
    <p class="pb-muted count">共 {{ list?.total ?? 0 }} 篇</p>

    <div class="list">
      <PbGuideCard v-for="guide in list?.items ?? []" :key="guide.id" :guide="guide" />
    </div>
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
</style>
