<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { AdminGuideDetail, GuideDetail } from '@paibook/contracts'

definePageMeta({ ssr: false })

useHead({
  title: '草稿预览 · PaiBook',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const route = useRoute()
const guide = ref<GuideDetail | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    const detail = await $fetch<AdminGuideDetail>(apiUrl(`/api/admin/guides/${route.params.id}`))
    guide.value = {
      id: detail.id,
      gameId: detail.gameId,
      slug: detail.slug,
      title: detail.title,
      summary: detail.summary,
      body: detail.body,
      publishedAt: detail.publishedAt,
      version: detail.version,
      entities: detail.entities,
    }
  } catch {
    error.value = '拿不到这篇草稿：可能没登录，或者它已经被删了。'
  }
})
</script>

<template>
  <main class="pb-shell">
    <NuxtLink class="back" to="/admin">← 回到写作台</NuxtLink>

    <p v-if="error" class="pb-muted error">{{ error }}</p>
    <p v-else-if="!guide" class="pb-muted">正在准备预览…</p>

    <PbGuideArticle v-else :guide="guide" preview />
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
  color: var(--pb-accent-foreground);
}
.error {
  margin: 0;
}
</style>
