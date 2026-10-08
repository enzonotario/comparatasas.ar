<script setup lang="ts">
import { barX, defineChart, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber } from '~/lib/fci-fund-formatters'
import {
  PROVIDER_AXIS_LOGO_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  format?: 'compact' | 'percent'
  heightClass?: string
  logos?: Readonly<Record<string, string>>
}>()

const { textColor, gridLineColor } = useChartTheme()

function formatValue(value: number) {
  if (props.format === 'percent') {
    return `${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 1,
    }).format(value * 100)}%`
  }
  return formatCompactNumber(value)
}

const rows = computed(() =>
  props.labels.map((label, index) => ({
    label,
    value: props.values[index] ?? 0,
    color: props.colors?.[index],
  })),
)

const logos = computed(() =>
  providerLogoMap(Object.entries(props.logos ?? {}).map(([name, logo]) => ({ name, logo }))),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'after')

const definition = computed(() => {
  const data = rows.value

  return defineChart(
    {
      marks: [
        barX(data, {
          x: 'value',
          y: 'label',
          key: 'label',
          fill: (row) => row.color ?? '#2563eb',
          maxThickness: 22,
          radius: { end: 6 },
        }),
        decorative(
          text(data, {
            x: 'value',
            y: 'label',
            text: (row) => formatValue(row.value),
            key: 'label',
            anchor: (row) => (row.value < 0 ? 'end' : 'start'),
            dx: (row) => (row.value < 0 ? -6 : 6),
            fontSize: 11,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid: { stroke: gridLineColor.value },
          axis: {
            ticks: {
              format: (value: number) => formatValue(value),
            },
          },
        },
        y: {
          scale: () => scaleBand<string>().padding(0.2),
          grid: false,
          axis: {
            line: false,
            ticks: { size: 0 },
            tickLabels: {
              dx: ({ value }) => (logos.value.has(String(value)) ? PROVIDER_AXIS_LOGO_DX : 0),
            },
          },
        },
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
    },
    {
      focus: 'group-y',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const point = points[0]
          if (!point) return { rows: [] }
          const value = typeof point.xValue === 'number' ? point.xValue : point.datum.value
          return {
            title: point.datum.label,
            color: point.datum.color,
            rows: [{ label: 'Valor', value: formatValue(value) }],
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
        aria-label="Comparación por categoría"
        class="h-full w-full"
        :style="{ height: '100%' }"
        @render="paintLogos"
      />
    </div>
    <template #fallback>
      <div :class="heightClass ?? 'h-80 w-full'" class="rounded-lg bg-elevated/40" />
    </template>
  </ClientOnly>
</template>
