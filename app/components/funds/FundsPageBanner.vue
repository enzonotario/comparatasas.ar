<script setup lang="ts">
const useSponsorBanner = computed(() => {
  const cutoffDate = new Date('2026-01-01')
  const today = new Date()
  return today >= cutoffDate
})
</script>

<template>
  <div class="shrink-0 w-full max-w-6xl mx-auto">
    <SponsorBanner v-if="useSponsorBanner" />
    <AdBanner v-else />
  </div>
</template>
