<script setup lang="ts">
import type { NavigationCategory } from '~/composables/useNavigationPages'
import FlagARS from '~/components/icons/FlagARS.vue'
import FlagUSD from '~/components/icons/FlagUSD.vue'
import BitcoinIcon from '~/components/icons/BitcoinIcon.vue'

const route = useRoute()
const { categories, getCategoryByRoute, isCategoryActive } = useNavigationPages()

const getCurrentCategory = computed(() => {
  return getCategoryByRoute(route.path)
})

const getCategoryRoute = (category: NavigationCategory): string => {
  // Retorna la primera página de la categoría
  return category.pages[0]?.to ?? '/'
}

const getIconComponent = (icon: string) => {
  if (icon === 'flag-ars') return FlagARS
  if (icon === 'flag-usd') return FlagUSD
  if (icon === 'bitcoin') return BitcoinIcon
  return null
}
</script>

<template>
  <div v-if="getCurrentCategory" class="flex flex-row justify-center h-[var(--ui-header-height)]">
    <NuxtLink
      v-for="category in categories"
      :key="category.id"
      :to="getCategoryRoute(category)"
      class="relative flex justify-center items-center gap-2 px-3 h-full sm:w-28 text-sm"
      :class="
        isCategoryActive(category, route.path)
          ? 'text-primary-600 dark:text-primary-400 bg-primary-100/30 dark:bg-primary-900/20 border-t-2 border-primary-500 dark:border-primary-800'
          : 'border-t-2 border-transparent hover:border-black dark:hover:border-white hover:bg-zinc-200/30 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
      "
    >
      <component
        :is="getIconComponent(category.icon)"
        v-if="getIconComponent(category.icon)"
        class="size-4 flex-shrink-0"
      />
      <UIcon v-else :name="category.icon" class="size-4" />
      <span class="hidden sm:inline-block text-base">{{ category.label }}</span>
    </NuxtLink>
  </div>
</template>
