<script setup lang="ts">
const games = '《原神》《崩坏：星穹铁道》《绝区零》'
</script>

<template>
  <div class="pb-app">
    <PbSiteHeader title="PaiBook · 派书" tagline="不是应急食品，是应急手册！" home="/" />
    <NuxtPage />
    <PbSiteFooter :game="games" />
  </div>
</template>
