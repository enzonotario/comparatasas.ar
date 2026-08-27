<script setup lang="ts">
import { getFundDetailTo, type FundDetailTab } from '~/lib/funds-detail'

const props = withDefaults(
  defineProps<{
    tab: FundDetailTab
    slug: string
    size?: 'sm' | 'xs'
    fullWidth?: boolean
  }>(),
  {
    size: 'sm',
    fullWidth: false,
  },
)

const route = useRoute()

const periodo = computed(() =>
  typeof route.query.periodo === 'string' ? route.query.periodo : undefined,
)

const tabs = computed(() => [
  {
    label: 'Resumen',
    value: 'resumen' as const,
    to: getFundDetailTo(props.slug),
  },
  {
    label: 'Histórico',
    value: 'historico' as const,
    to: getFundDetailTo(props.slug, { tab: 'historico', periodo: periodo.value }),
  },
])
</script>

<template>
  <div
    role="tablist"
    class="relative flex p-1 bg-elevated rounded-lg"
    :class="fullWidth ? 'w-full' : 'w-auto'"
  >
    <NuxtLink
      v-for="item in tabs"
      :key="item.value"
      :to="item.to"
      role="tab"
      :aria-selected="tab === item.value"
      class="group relative inline-flex items-center justify-center min-w-0 font-medium rounded-md transition-colors"
      :class="[
        size === 'xs' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs',
        fullWidth ? 'flex-1' : '',
        tab === item.value
          ? 'text-inverted bg-inverted shadow-xs'
          : 'text-muted hover:text-default',
      ]"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
