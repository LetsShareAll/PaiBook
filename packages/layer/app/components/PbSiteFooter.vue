<script setup lang="ts">
defineProps<{
  game: string
  attribution?: string
}>()

const year = new Date().getFullYear()
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
.pb-footer__meta {
  margin-bottom: 0;
  opacity: 0.8;
}
</style>
