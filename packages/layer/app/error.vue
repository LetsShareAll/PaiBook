<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const branding = useSiteBranding()
const isMissing = computed(() => props.error.statusCode === 404)
const heading = computed(() => (isMissing.value ? '这一页不在手册里' : '手册翻到一半卡住了'))
</script>

<template>
  <div class="pb-app">
    <PbSiteHeader :title="branding.headerTitle" :tagline="branding.tagline" />

    <main class="pb-shell">
      <p class="code">{{ error.statusCode }}</p>
      <h1 class="pb-title">{{ heading }}</h1>
      <p class="pb-muted lead">
        {{
          isMissing
            ? '链接可能过期了，或者这篇攻略还没发布。可以试试搜索，或者回到攻略列表。'
            : '服务端出了点问题，稍后再试；如果一直这样，可能是我在部署。'
        }}
      </p>

      <form class="search" :action="apiUrl('/search')" method="get">
        <input class="search__input" type="search" name="q" placeholder="搜索攻略…" aria-label="搜索攻略" />
        <button class="pb-btn pb-btn--primary" type="submit">搜索</button>
      </form>

      <div class="links">
        <NuxtLink class="pb-btn" to="/">回到攻略列表</NuxtLink>
        <button class="pb-btn pb-btn--ghost" type="button" @click="clearError({ redirect: '/' })">重试一次</button>
      </div>
    </main>

    <PbSiteFooter :game="branding.gameName" :attribution="branding.attribution" />
  </div>
</template>

<style scoped>
.code {
  font-family: var(--pb-font-mono);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--pb-accent);
  margin: 0 0 var(--pb-space-2);
}
.lead {
  margin: 0 0 var(--pb-space-4);
  max-width: 52ch;
}
.search {
  display: flex;
  gap: var(--pb-space-2);
  margin-bottom: var(--pb-space-3);
}
.search__input {
  flex: 1;
  max-width: 320px;
  padding: var(--pb-space-2);
  border: var(--pb-border-width) solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 14px;
}
.links {
  display: flex;
  gap: var(--pb-space-2);
}
</style>
