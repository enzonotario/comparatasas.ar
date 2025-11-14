<script setup lang="ts">
import type { NavigationPage } from '~/composables/useNavigationPages'

interface Props {
  pages: NavigationPage[]
  currentRoute: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex flex-col space-y-2">
    <NuxtLink
      v-for="page in pages"
      :key="page.to"
      :to="page.to"
      class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
      :class="{
        'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200':
          page.to.split('#')[0] === currentRoute,
      }"
    >
      <img :src="page.image" :alt="page.label" class="size-6" />
      <span class="font-medium text-gray-900 dark:text-white">{{ page.label }}</span>
    </NuxtLink>
  </div>
</template>
