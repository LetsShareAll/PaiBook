<script setup lang="ts">
import type { GuideSummary } from '@paibook/contracts'

interface GameEntry {
  id: string
  titleZh: string
  titleEn: string
  tagline: string
  href: string
}

const [{ data: games }, { data: recent }] = await Promise.all([
  useFetch<{ items: GameEntry[] }>('/api/games'),
  useFetch<{ items: GuideSummary[] }>('/api/recent'),
])

const titleOf = (id: string) => games.value?.items.find((game) => game.id === id)?.titleZh ?? id

useSiteSeo()
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">选择你的应急手册</h1>
    <p class="pb-muted intro">三款游戏，三本站内手册。攻略都由本站撰写与整理。</p>

    <nav class="games">
      <!-- 跨 Worker 的链接必须用普通 <a>：NuxtLink 会走本应用的路由，而游戏站是另一个 Worker -->
      <a v-for="game in games?.items ?? []" :key="game.id" class="game pb-panel" :href="game.href">
        <span class="game__title">{{ game.titleZh }}</span>
        <span class="game__tagline pb-muted">{{ game.tagline }}</span>
        <span class="game__en pb-muted">{{ game.titleEn }}</span>
      </a>
    </nav>

    <section v-if="recent?.items.length" class="recent">
      <h2 class="section">最近更新</h2>
      <ul class="list">
        <li v-for="guide in recent.items" :key="guide.id" class="item">
          <a class="item__link" :href="`/${guide.gameId}/guides/${guide.slug}`">
            <span class="item__title">{{ guide.title }}</span>
          </a>
          <span class="pb-badge">{{ titleOf(guide.gameId) }}</span>
          <span v-if="guide.publishedAt" class="pb-muted item__date">{{ guide.publishedAt.slice(0, 10) }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.intro {
  margin: 0 0 var(--pb-space-4);
  font-size: 14px;
}
.games {
  display: grid;
  gap: var(--pb-space-3);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.game {
  display: grid;
  gap: var(--pb-space-1);
  padding: var(--pb-space-4);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease;
}
.game:hover {
  border-color: var(--pb-accent);
}
.game__title {
  font-family: var(--pb-font-display);
  font-size: 20px;
  font-weight: 700;
}
.game__tagline {
  font-size: 13px;
}
.game__en {
  font-size: 12px;
  letter-spacing: 0.04em;
}
.recent {
  margin-top: var(--pb-space-5);
}
.section {
  font-family: var(--pb-font-display);
  font-size: 18px;
  margin: 0 0 var(--pb-space-3);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--pb-space-2);
}
.item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pb-space-2);
  padding-bottom: var(--pb-space-2);
  border-bottom: 1px solid var(--pb-edge);
}
.item__link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}
.item__link:hover {
  color: var(--pb-accent-ink);
}
.item__date {
  font-size: 12px;
}
</style>
