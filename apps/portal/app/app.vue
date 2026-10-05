<script setup lang="ts">
const branding = useSiteBranding()
</script>

<template>
  <div class="pb-app">
    <PbSiteHeader title="PaiBook · 派书" :tagline="branding.tagline" home="/" />
    <NuxtPage />
    <PbSiteFooter :game="branding.gameName" />
  </div>
</template>
