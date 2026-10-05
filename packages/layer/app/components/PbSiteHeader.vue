<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  tagline: string
  home?: string
}>()

/** 站点标识：由挂载前缀推导（/genshin/ → genshin），门厅没有前缀。 */
const site = computed(() => {
  const base = String(useRuntimeConfig().app.baseURL ?? '/').replaceAll('/', '')
  return base || 'portal'
})
</script>

<template>
  <header class="pb-header">
    <div class="pb-header__inner">
      <NuxtLink class="pb-header__brand" :to="home ?? '/'">
        <!-- 原神：菱形书签 + 双翼弧 -->
        <svg v-if="site === 'genshin'" class="pb-header__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.4l1.9 4.3 4.3 1.9-4.3 1.9L12 15.8l-1.9-4.3L5.8 9.6l4.3-1.9z" fill="currentColor" />
          <path d="M3.6 12c2.6.6 4.6 1.6 6.2 3M20.4 12c-2.6.6-4.6 1.6-6.2 3" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linecap="round" />
        </svg>

        <!-- 星铁：导轨与节点 -->
        <svg v-else-if="site === 'honkaistarrail'" class="pb-header__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 16.5h19" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          <path d="M5 16.5V13m4 3.5V13m6 3.5V13m4 3.5V13" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".7" />
          <circle cx="12" cy="8.4" r="3.1" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 2.6v2M4.3 5.6l1.5 1.4M19.7 5.6l-1.5 1.4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
        </svg>

        <!-- 绝区零：锯齿信号 -->
        <svg v-else-if="site === 'zenlesszonezero'" class="pb-header__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 15.5l4-7 4 7 4-11 3.4 11h3.6" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="miter" />
        </svg>

        <!-- 门厅：书页 -->
        <svg v-else class="pb-header__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.2c2.7-.8 5.3-.6 8 .8 2.7-1.4 5.3-1.6 8-.8v13c-2.7-.8-5.3-.6-8 .8-2.7-1.4-5.3-1.6-8-.8z" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M12 6v12" stroke="currentColor" stroke-width="1.1" opacity=".6" />
        </svg>

        <span class="pb-header__title">{{ props.title }}</span>
      </NuxtLink>

      <p class="pb-header__tagline">{{ tagline }}</p>

      <div class="pb-header__nav">
        <NuxtLink class="pb-header__navlink" to="/profile">我的档案</NuxtLink>
      </div>

      <form class="pb-header__search" :action="apiUrl('/search')" method="get">
        <input class="pb-header__input" type="search" name="q" placeholder="搜索攻略…" aria-label="搜索攻略" />
      </form>
    </div>

    <div class="pb-header__rule" :class="`pb-header__rule--${site}`" aria-hidden="true">
      <span v-if="site === 'zenlesszonezero'" class="pb-header__hazard" />
      <span v-else class="pb-header__diamond" />
    </div>
  </header>
</template>

<style scoped>
.pb-header {
  background: linear-gradient(var(--pb-surface), transparent);
  border-bottom: 1px solid var(--pb-edge);
}
.pb-header__inner {
  max-width: var(--pb-measure);
  margin: 0 auto;
  padding: var(--pb-space-5) var(--pb-space-4) var(--pb-space-3);
}
.pb-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--pb-space-2);
  color: inherit;
  text-decoration: none;
}
.pb-header__mark {
  width: 24px;
  height: 24px;
  color: var(--pb-accent);
  flex: none;
}
.pb-header__title {
  font-family: var(--pb-font-display);
  font-size: 24px;
  font-weight: var(--pb-display-weight);
  letter-spacing: var(--pb-display-tracking);
}
.pb-header__tagline {
  margin: var(--pb-space-2) 0 0;
  color: var(--pb-muted);
  font-size: 13px;
  letter-spacing: 0.06em;
}
.pb-header__nav {
  margin-top: var(--pb-space-3);
}
.pb-header__navlink {
  color: var(--pb-muted);
  font-size: 13px;
  text-decoration: none;
}
.pb-header__navlink:hover {
  color: var(--pb-accent-ink);
}
.pb-header__search {
  margin-top: var(--pb-space-2);
}
.pb-header__input {
  width: 100%;
  max-width: 320px;
  padding: 5px 10px;
  border: var(--pb-border-width) solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 13px;
}
.pb-header__input:focus {
  outline: 2px solid var(--pb-accent);
  outline-offset: -1px;
}
.pb-header__rule {
  position: relative;
  max-width: var(--pb-measure);
  margin: 0 auto;
  height: 2px;
}
.pb-header__rule--genshin {
  background: linear-gradient(90deg, transparent, var(--pb-accent), transparent);
}
.pb-header__rule--honkaistarrail {
  height: 3px;
  background-image: repeating-linear-gradient(90deg, var(--pb-accent) 0 10px, transparent 10px 18px);
  opacity: 0.8;
}
.pb-header__rule--zenlesszonezero {
  height: 4px;
  background-image: repeating-linear-gradient(-45deg, var(--pb-accent) 0 6px, transparent 6px 14px);
}
.pb-header__rule--portal {
  background: linear-gradient(90deg, transparent, var(--pb-accent), transparent);
}
.pb-header__diamond {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  translate: -50% -50%;
  rotate: 45deg;
  background: var(--pb-accent);
}
.pb-header__hazard {
  position: absolute;
  inset: 0;
}
</style>
