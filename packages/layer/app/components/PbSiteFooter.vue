<script setup lang="ts">
defineProps<{
  game: string
  attribution?: string
}>()

const year = new Date().getFullYear()

/** 站点标识：由挂载前缀推导（/genshin/ → genshin），门厅没有前缀。 */
const site = computed(() => {
  const base = String(useRuntimeConfig().app.baseURL ?? '/').replaceAll('/', '')
  return base || 'portal'
})
</script>

<template>
  <footer class="pb-footer">
    <div class="pb-footer__inner">
      <p class="pb-footer__disclaimer">
        本站是非官方粉丝站点，与米哈游及 COGNOSPHERE PTE. LTD. 及其关联公司没有任何关联，也未获得其赞助或认可。{{
          game
        }}及其素材的权利归米哈游所有。本站不使用官方美术素材与游戏内字体，所有图标与装饰均自行绘制。
      </p>
      <p v-if="attribution" class="pb-footer__disclaimer">{{ attribution }}</p>
      <p class="pb-footer__note">
        本站完全免费：没有广告、没有打赏、没有会员。内容以 CC BY-NC-SA 4.0 授权。
      </p>
      <!-- 长页面滚到底时页头已经在屏幕外，所以这里再给一次出路。
           跨 Worker 的链接（门厅）必须是普通 <a>，NuxtLink 会走本应用的路由。 -->
      <nav class="pb-footer__nav">
        <a v-if="site !== 'portal'" class="pb-footer__link" href="/">门厅</a>
        <NuxtLink class="pb-footer__link" to="/codex">图鉴</NuxtLink>
        <NuxtLink class="pb-footer__link" to="/search">搜索</NuxtLink>
        <NuxtLink class="pb-footer__link" to="/profile">我的档案</NuxtLink>
      </nav>
      <p class="pb-footer__meta">© {{ year }} PaiBook · 派书</p>
    </div>
  </footer>
</template>

<style scoped>
.pb-footer {
  border-top: 1px solid var(--pb-edge);
  background: var(--pb-surface-alt);
}
.pb-footer__inner {
  max-width: var(--pb-measure);
  margin: 0 auto;
  padding: var(--pb-space-4);
}
.pb-footer__disclaimer,
.pb-footer__note,
.pb-footer__meta {
  margin: 0 0 var(--pb-space-2);
  color: var(--pb-muted);
  font-size: 12px;
  line-height: 1.8;
}
.pb-footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pb-space-3);
  margin: 0 0 var(--pb-space-3);
}
.pb-footer__link {
  color: var(--pb-muted);
  font-size: 13px;
  text-decoration: none;
}
.pb-footer__link:hover {
  color: var(--pb-accent-foreground);
}
.pb-footer__meta {
  margin-bottom: 0;
  opacity: 0.8;
}
</style>
