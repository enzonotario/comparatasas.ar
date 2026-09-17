<script setup lang="ts">
import { provide } from 'vue'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber, formatDate } from '~/lib/fci-fund-formatters'
import type { MarketHistoryPoint } from '~/lib/fci-market-flows'

type ChartOption = ComposeOption<
  LineSeriesOption | BarSeriesOption | GridComponentOption | TooltipComponentOption
>

const props = defineProps<{
  points: MarketHistoryPoint[]
  mode: 'patrimonio' | 'flujo'
  heightClass?: string
}>()

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

const { textColor, gridLineColor } = useChartTheme()

const option = computed<ChartOption>(() => {
  const labels = props.points.map((point) => formatDate(point.fecha))
  const values = props.points.map((point) =>
    props.mode === 'flujo' ? point.flujoEstimado : point.patrimonio,
  )
  const isFlow = props.mode === 'flujo'

  return {
    animationDuration: 400,
    grid: { top: 16, right: 16, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => formatCompactNumber(Number(value)),
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: textColor.value, hideOverlap: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: gridLineColor.value } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => formatCompactNumber(value),
      },
      splitLine: { lineStyle: { color: gridLineColor.value } },
    },
    series: [
      isFlow
        ? {
            type: 'bar',
            data: values.map((value) => ({
              value,
              itemStyle: {
                color: value >= 0 ? '#0f766e' : '#e11d48',
                borderRadius: value >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
              },
            })),
            barMaxWidth: 18,
          }
        : {
            type: 'line',
            data: values,
            smooth: true,
            showSymbol: false,
            color: '#0f766e',
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#0f766e55' },
                  { offset: 1, color: '#0f766e05' },
                ],
              },
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
