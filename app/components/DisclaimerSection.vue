<script setup lang="ts">
import { computed } from 'vue'
import { getDisclaimers } from '~/lib/disclaimers'

const props = defineProps<{ page?: string }>()

const disclaimers = computed(() => getDisclaimers(props.page || 'global'))
</script>

<template>
  <UCard class="max-w-3xl mx-auto bg-neutral-100 dark:bg-neutral-950">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-info" class="size-5 text-primary-600" />
        <h2 class="text-lg font-bold">Descargo de responsabilidad</h2>
      </div>
    </template>

    <div class="space-y-2">
      <p
        v-for="(text, index) in disclaimers"
        :key="index"
        class="text-sm text-neutral-800 dark:text-neutral-200"
      >
        {{ text }}
      </p>
    </div>
  </UCard>
</template>
