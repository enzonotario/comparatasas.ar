<script setup lang="ts">
import { areaY, barY, defineChart, lineY } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber, formatDate } from '~/lib/fci-fund-formatters'
import type { MarketHistoryPoint } from '~/lib/fci-market-flows'

const props = defineProps<{
  points: MarketHistoryPoint[]
  mode: 'patrimonio' | 'flujo'
  heightClass?: string
}>()

const { textColor, gridLineColor } = useChartTheme()

const rows = computed(() =>
  props.points.map((point) => ({
    fecha: point.fecha,
    value: props.mode === 'flujo' ? point.flujoEstimado : point.patrimonio,
  })),
)

const definition = computed(() => {
  const isFlow = props.mode === 'flujo'
  const data = rows.value
  const theme = {
    foreground: textColor.value,
    muted: textColor.value,
    grid: gridLineColor.value,
    background: 'transparent',
  }
  const xAxis = {
    line: { stroke: gridLineColor.value },
    ticks: {
      format: (value: string) => formatDate(value),
    },
    tickLabels: { thin: true },
  }

  if (isFlow) {
    return defineChart(
      {
        marks: [
          barY(data, {
            x: 'fecha',
            y: 'value',
            key: 'fecha',
            fill: (row) => (row.value >= 0 ? '#0f766e' : '#e11d48'),
            maxThickness: 18,
            radius: { end: 4 },
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand<string>().padding(0.2),
            grid: false,
            axis: xAxis,
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: { stroke: gridLineColor.value },
            axis: {
              ticks: {
                format: (value: number) => formatCompactNumber(value),
              },
            },
          },
        },
        theme,
      },
      {
        focus: 'group-x',
        maxFocusDistance: Number.POSITIVE_INFINITY,
        tooltip: {
          use: tooltip,
          content: (points) => {
            const point = points[0]
            if (!point) return { rows: [] }
            const value = point.datum.value
            return {
              title: formatDate(point.datum.fecha),
              rows: [
                {
                  label: 'Flujo',
                  value: formatCompactNumber(value),
                  color: value >= 0 ? '#0f766e' : '#e11d48',
                },
              ],
            }
          },
        },
      },
    )
  }

  return defineChart(
    {
      marks: [
        decorative(
          areaY(data, {
            x: 'fecha',
            y: 'value',
            fill: 'url(#aum-fill)',
          }),
        ),
        lineY(data, {
          x: 'fecha',
          y: 'value',
          key: 'fecha',
          stroke: '#0f766e',
          strokeWidth: 2,
        }),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().padding(0.2),
          grid: false,
          axis: xAxis,
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: { stroke: gridLineColor.value },
          axis: {
            ticks: {
              format: (value: number) => formatCompactNumber(value),
            },
          },
        },
      },
      clip: true,
      gradients: [
        {
          id: 'aum-fill',
          x1: 0,
          y1: 1,
          x2: 0,
          y2: 0,
          stops: [
            { offset: 0, color: '#0f766e', opacity: 0.02 },
            { offset: 1, color: '#0f766e', opacity: 0.33 },
          ],
        },
      ],
      theme,
    },
    {
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const point = points[0]
          if (!point) return { rows: [] }
          return {
            title: formatDate(point.datum.fecha),
            rows: [
              {
                label: 'Patrimonio',
                value: formatCompactNumber(point.datum.value),
                color: '#0f766e',
              },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <ClientOnly>
    <div :class="heightClass ?? 'h-80 w-full'">
      <Chart
        :definition="definition"
        :aria-label="mode === 'flujo' ? 'Flujo estimado' : 'Evolución del patrimonio'"
        class="h-full w-full"
        :style="{ height: '100%' }"
      />
    </div>
    <template #fallback>
      <div :class="heightClass ?? 'h-80 w-full'" class="rounded-lg bg-elevated/40" />
    </template>
  </ClientOnly>
</template>
