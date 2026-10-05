<script setup lang="ts">
const branding = useSiteBranding()
</script>

<template>
  <div class="pb-app">
    <PbSiteHeader :title="branding.headerTitle" :tagline="branding.tagline" />
    <NuxtPage />
    <PbSiteFooter :game="branding.gameName" :attribution="branding.attribution" />
  </div>
</template>
