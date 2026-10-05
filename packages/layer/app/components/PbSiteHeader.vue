<script setup lang="ts">
defineProps<{
  title: string
  tagline: string
  home?: string
}>()
</script>

<template>
  <header class="pb-header">
    <div class="pb-header__inner">
      <NuxtLink class="pb-header__brand" :to="home ?? '/'">
        <svg class="pb-header__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.6l2.5 4.1 4.6 1.1-3.2 3.5.9 4.7L12 13.8 7.2 16l.9-4.7L4.9 7.8l4.6-1.1z"
            fill="currentColor"
          />
        </svg>
        <span class="pb-header__title">{{ title }}</span>
      </NuxtLink>
      <p class="pb-header__tagline">{{ tagline }}</p>
      <form class="pb-header__search" :action="apiUrl('/search')" method="get">
        <input
          class="pb-header__input"
          type="search"
          name="q"
          placeholder="搜索攻略…"
          aria-label="搜索攻略"
        />
      </form>
    </div>
    <div class="pb-header__rule" aria-hidden="true">
      <span class="pb-header__diamond" />
    </div>
  </header>
</template>

<style scoped>
.pb-header {
  background: linear-gradient(var(--pb-surface), var(--pb-paper));
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
  width: 22px;
  height: 22px;
  color: var(--pb-accent);
  flex: none;
}
.pb-header__title {
  font-family: var(--pb-font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.pb-header__tagline {
  margin: var(--pb-space-2) 0 0;
  color: var(--pb-muted);
  font-size: 13px;
  letter-spacing: 0.06em;
}
.pb-header__search {
  margin-top: var(--pb-space-3);
}
.pb-header__input {
  width: 100%;
  max-width: 320px;
  padding: 5px 10px;
  border: 1px solid var(--pb-edge);
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
  height: 1px;
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
</style>
