<script setup lang="ts">
import { provide } from 'vue'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber } from '~/lib/fci-fund-formatters'

type BarOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  format?: 'compact' | 'percent'
  heightClass?: string
}>()

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

const { textColor, gridLineColor } = useChartTheme()

function formatValue(value: number) {
  if (props.format === 'percent') {
    return `${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 1,
    }).format(value * 100)}%`
  }
  return formatCompactNumber(value)
}

const option = computed<BarOption>(() => {
  const labels = [...props.labels].reverse()
  const values = [...props.values].reverse()
  const colors = props.colors ? [...props.colors].reverse() : undefined

  return {
    animationDuration: 400,
    grid: { top: 8, right: 56, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => formatValue(Number(value)),
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => formatValue(value),
      },
      splitLine: { lineStyle: { color: gridLineColor.value } },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: textColor.value,
        width: 140,
        overflow: 'truncate',
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values.map((value, index) => ({
          value,
          itemStyle: { color: colors?.[index], borderRadius: [0, 6, 6, 0] },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: 'right',
          color: textColor.value,
          formatter: (params) => formatValue(Number(params.value)),
        },
      },
    ],
  }
})
</script>

<template>
  <ClientOnly>
    <div :class="heightClass ?? 'h-80 w-full'">
      <VChart :option="option" class="h-full w-full" autoresize />
    </div>
    <template #fallback>
      <div :class="heightClass ?? 'h-80 w-full'" class="rounded-lg bg-elevated/40" />
    </template>
  </ClientOnly>
</template>
