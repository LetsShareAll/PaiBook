<script setup lang="ts">
import { gameCatalog } from '@paibook/contracts'

const game = gameCatalog.genshin
</script>

<template>
  <div class="pb-app">
    <PbSiteHeader :title="`派蒙的应急手册 · ${game.tagline}`" tagline="不是应急食品，是应急手册！" />
    <NuxtPage />
    <PbSiteFooter :game="game.titleZh" />
  </div>
</template>
