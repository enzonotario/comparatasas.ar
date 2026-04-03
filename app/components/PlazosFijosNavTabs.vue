<script setup lang="ts">
const route = useRoute()

const tabs = [
  { to: '/plazos-fijos', label: 'Tradicional (30 días)', icon: 'i-lucide-clock' as const },
  {
    to: '/plazos-fijos/uva-pago-periodico',
    label: 'UVA pago periódico',
    icon: 'i-lucide-calendar-range' as const,
  },
]

function isActive(tabTo: string): boolean {
  const p = route.path.replace(/\/$/, '') || '/'
  const t = tabTo.replace(/\/$/, '') || '/'
  return p === t
}
</script>

<template>
  <nav
    class="sticky z-20 top-[var(--ui-header-height)] bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 -mx-px"
    aria-label="Tipo de plazo fijo"
  >
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
      </NuxtLink>
    </div>
  </nav>
</template>
