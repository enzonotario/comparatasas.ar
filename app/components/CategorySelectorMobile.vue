<script setup lang="ts">
import type { NavigationCategory } from '~/composables/useNavigationPages'
import FlagARS from '~/components/icons/FlagARS.vue'
import FlagUSD from '~/components/icons/FlagUSD.vue'
import BitcoinIcon from '~/components/icons/BitcoinIcon.vue'

const route = useRoute()
const { categories, getCategoryByRoute, isCategoryActive } = useNavigationPages()

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
  <div class="flex flex-col space-y-2">
    <NuxtLink
      v-for="category in categories"
      :key="category.id"
      :to="getCategoryRoute(category)"
      class="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-3 rounded-md"
      :class="{
        'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20':
          isCategoryActive(category, route.path),
      }"
    >
      <component
        :is="getIconComponent(category.icon)"
        v-if="getIconComponent(category.icon)"
        class="w-5 h-5 flex-shrink-0"
      />
      <UIcon v-else :name="category.icon" class="w-5 h-5" />
      <span class="text-base">{{ category.label }}</span>
    </NuxtLink>
  </div>
</template>
