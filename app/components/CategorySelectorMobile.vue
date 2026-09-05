<script setup lang="ts">
import {
  groupNavigationPages,
  type NavigationCategory,
} from '~/composables/useNavigationPages'
import FlagARS from '~/components/icons/FlagARS.vue'
import FlagUSD from '~/components/icons/FlagUSD.vue'
import BitcoinIcon from '~/components/icons/BitcoinIcon.vue'

const route = useRoute()
const { categories, getCategoryByRoute, isCategoryActive, isActive } = useNavigationPages()

const getCategoryRoute = (category: NavigationCategory): string => {
  return category.pages[0]?.to ?? '/'
}

const getIconComponent = (icon: string) => {
  if (icon === 'flag-ars') return FlagARS
  if (icon === 'flag-usd') return FlagUSD
  if (icon === 'bitcoin') return BitcoinIcon
  return null
}

const currentCategory = computed(() => getCategoryByRoute(route.path))

const categoryGroups = computed(() =>
  Object.fromEntries(
    categories.map((category) => [category.id, groupNavigationPages(category.pages)]),
  ),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-for="category in categories" :key="category.id" class="space-y-1">
      <NuxtLink
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

      <div
        v-if="
          category.pages.length > 1 &&
          (isCategoryActive(category, route.path) || currentCategory?.id === category.id)
        "
        class="ml-2 border-l border-default pl-2 space-y-3"
      >
        <section
          v-for="group in categoryGroups[category.id]"
          :key="`${category.id}-${group.id}`"
          class="space-y-0.5"
        >
          <p
            v-if="(categoryGroups[category.id]?.length ?? 0) > 1"
            class="px-3 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            {{ group.label }}
          </p>
          <NuxtLink
            v-for="page in group.pages"
            :key="page.to"
            :to="page.to"
            class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
            :class="
              isActive(page)
                ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
            "
          >
            <img :src="page.image" alt="" class="size-6 shrink-0" aria-hidden="true" />
            <span class="min-w-0 truncate">{{ page.label }}</span>
          </NuxtLink>
        </section>
      </div>
    </div>
  </div>
</template>
