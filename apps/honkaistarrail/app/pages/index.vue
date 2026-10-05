<script setup lang="ts">
import type { GuideLink, GuideList } from '@paibook/contracts'

const [{ data: list }, { data: links }] = await Promise.all([
  useFetch<GuideList>(apiUrl('/api/guides')),
  useFetch<{ items: GuideLink[] }>(apiUrl('/api/links')),
])
</script>

<template>
  <PbGuideHome :guides="list?.items ?? []" :total="list?.total ?? 0" :links="links?.items ?? []" />
</template>
