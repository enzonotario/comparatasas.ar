<script setup lang="ts">
import type { NavigationPage } from '~/composables/useNavigationPages'

const route = useRoute()
const { getCurrentCategory, isActive } = useNavigationPages()

const currentCategory = computed(() => getCurrentCategory())

const getSubcategoryRoute = (page: NavigationPage): string => {
  return page.to
}
</script>

<template>
  <div
    v-if="currentCategory"
    class="bg-white/70 dark:bg-neutral-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky z-40 top-[var(--ui-header-height)]"
  >
    <div class="h-10 flex flex-row sm:justify-center overflow-x-auto">
      <UButton
        v-for="page in currentCategory.pages"
        :key="page.to"
        :variant="isActive(page, route.path) ? 'link' : 'ghost'"
        color="neutral"
        size="sm"
        :to="getSubcategoryRoute(page)"
        :class="[
          'h-full transition-all duration-200 rounded-none flex-shrink-0',
          isActive(page, route.path)
            ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent',
        ]"
      >
        <img :src="page.image" :alt="page.label" class="size-8" />
        {{ page.label }}
      </UButton>
    </div>
  </div>
</template>
