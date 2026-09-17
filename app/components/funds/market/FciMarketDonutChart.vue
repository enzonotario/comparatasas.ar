<script setup lang="ts">
import { provide } from 'vue'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber } from '~/lib/fci-fund-formatters'

type PieOption = ComposeOption<PieSeriesOption | TooltipComponentOption>

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  centerLabel?: string
  centerHint?: string
  heightClass?: string
}>()

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

const { textColor } = useChartTheme()

const option = computed<PieOption>(() => ({
  animationDuration: 400,
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      const item = params as { name?: string; value?: number; percent?: number }
      return `${item.name}<br/>${formatCompactNumber(item.value)} · ${item.percent}%`
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '78%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
      label: { show: false },
      data: props.labels.map((name, index) => ({
        name,
        value: props.values[index] ?? 0,
        itemStyle: {
          color: props.colors?.[index] ?? CHART_COLORS[index % CHART_COLORS.length],
        },
      })),
    },
  ],
  textStyle: { color: textColor.value },
}))
</script>

<template>
  <div class="relative" :class="heightClass ?? 'h-72 w-full'">
    <ClientOnly>
      <VChart :option="option" class="h-full w-full" autoresize />
      <template #fallback>
        <div class="h-full w-full rounded-lg bg-elevated/40" />
      </template>
    </ClientOnly>
    <div
      v-if="centerLabel"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
    >
      <p class="text-[10px] uppercase tracking-wide text-muted">{{ centerHint }}</p>
      <p class="text-sm font-semibold text-highlighted">{{ centerLabel }}</p>
    </div>
  </div>
</template>
