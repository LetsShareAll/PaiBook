<script setup lang="ts">
import type { GuideDetail } from '@paibook/contracts'

defineProps<{
  guide: GuideDetail
  /** 预览态：显示提示条，不参与分享卡片。 */
  preview?: boolean
}>()
</script>

<template>
  <article class="article">
    <p v-if="preview" class="draft-note">草稿预览：这是真实页面的渲染结果，但只对你可见，也没有进入搜索与站点地图。</p>

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

    <section class="pb-panel body">
      <p class="summary">{{ guide.summary }}</p>
      <PbProse class="prose" :markdown="guide.body" />
    </section>
  </article>
</template>

<style scoped>
.draft-note {
  margin: 0 0 var(--pb-space-3);
  padding: var(--pb-space-2) var(--pb-space-3);
  border-left: 3px solid var(--pb-accent);
  background: var(--pb-surface-alt);
  color: var(--pb-muted);
  font-size: 13px;
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
