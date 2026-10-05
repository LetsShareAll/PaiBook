<script setup lang="ts">
import type { GuideSummary } from '@paibook/contracts'

defineProps<{
  guide: GuideSummary
}>()
</script>

<template>
  <article class="pb-card pb-panel">
    <NuxtLink class="pb-card__link" :to="`/guides/${guide.slug}`">
      <h2 class="pb-card__title">{{ guide.title }}</h2>
    </NuxtLink>

    <p class="pb-card__meta">
      <span v-if="guide.version" class="pb-badge">{{ guide.version.label }}</span>
      <span v-if="guide.publishedAt" class="pb-muted pb-card__date">
        {{ guide.publishedAt.slice(0, 10) }}
      </span>
    </p>

    <p class="pb-card__summary">{{ guide.summary }}</p>

    <p v-if="guide.entities.length" class="pb-card__entities">
      <template v-for="(entity, index) in guide.entities" :key="entity.id">
        <span v-if="index > 0" class="pb-dot">◆</span>{{ entity.nameZh }}
      </template>
    </p>
  </article>
</template>

<style scoped>
.pb-card {
  padding: var(--pb-space-3) var(--pb-space-4);
  transition: border-color 0.15s ease;
}
.pb-card:hover {
  border-color: var(--pb-accent);
}
.pb-card__link {
  color: inherit;
  text-decoration: none;
}
.pb-card__title {
  font-family: var(--pb-font-display);
  font-size: 19px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.005em;
}
.pb-card__link:hover .pb-card__title {
  color: var(--pb-accent-foreground);
}
.pb-card__meta {
  display: flex;
  align-items: center;
  gap: var(--pb-space-2);
  margin: var(--pb-space-2) 0 0;
}
.pb-card__date {
  font-size: 12px;
}
.pb-card__summary {
  margin: var(--pb-space-2) 0 0;
  color: var(--pb-ink);
  opacity: 0.85;
}
.pb-card__entities {
  margin: var(--pb-space-2) 0 0;
  color: var(--pb-muted);
  font-size: 13px;
}
</style>
