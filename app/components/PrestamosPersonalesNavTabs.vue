<script setup lang="ts">
import { prestamosPersonalesNavTabs } from '~/lib/prestamos-personales-nav'

const props = defineProps<{
  plazoCount?: number
  bcraCount?: number
}>()

const route = useRoute()

const tabs = prestamosPersonalesNavTabs

function isActive(tabTo: string): boolean {
  const p = route.path.replace(/\/$/, '') || '/'
  const t = tabTo.replace(/\/$/, '') || '/'
  return p === t
}

function badgeFor(tabTo: string): number | undefined {
  if (tabTo === '/prestamos-personales') return props.plazoCount || undefined
  if (tabTo === '/prestamos-personales/bcra') return props.bcraCount || undefined
  return undefined
}
</script>

<template>
  <nav aria-label="Préstamos personales">
    <div class="flex flex-row overflow-x-auto h-10 sm:justify-center">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="inline-flex items-center gap-2 px-4 h-full flex-shrink-0 text-sm font-medium border-b-2 transition-colors"
        :class="
          isActive(tab.to)
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
        "
      >
        <UIcon :name="tab.icon" class="size-4 shrink-0" aria-hidden="true" />
        {{ tab.label }}
        <UBadge
          v-if="badgeFor(tab.to)"
          color="neutral"
          variant="subtle"
          size="sm"
          class="tabular-nums"
        >
          {{ badgeFor(tab.to) }}
        </UBadge>
      </NuxtLink>
    </div>
  </nav>
</template>
