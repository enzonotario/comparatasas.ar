<script setup lang="ts">
defineProps<{
  length?: number
}>()
</script>

<template>
  <div class="space-y-3">
    <USkeleton
      v-for="n in length || 10"
      :key="n"
      class="h-24 rounded-lg ring ring-default"
      :ui="{ rounded: 'rounded-lg' }"
    />
  </div>
</template>
