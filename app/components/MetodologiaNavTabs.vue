<script setup lang="ts">
import { metodologiaNavTabs } from '~/lib/metodologia-nav'

const route = useRoute()

function isActive(tabTo: string): boolean {
  const p = route.path.replace(/\/$/, '') || '/'
  const t = tabTo.replace(/\/$/, '') || '/'
  return p === t
}
</script>

<template>
  <nav aria-label="Categoría de metodología">
    <div class="flex flex-row overflow-x-auto h-10 sm:justify-center">
      <NuxtLink
        v-for="tab in metodologiaNavTabs"
        :key="tab.to"
        :to="tab.to"
        class="inline-flex items-center px-4 h-full flex-shrink-0 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
        :class="
          isActive(tab.to)
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
        "
      >
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
