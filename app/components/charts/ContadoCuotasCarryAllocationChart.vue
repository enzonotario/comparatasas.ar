<script setup lang="ts">
import { barX, defineChart, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import type { InvestmentCarryAllocation } from '~/lib/finance/contado-cuotas-carry'
import { CHART_COLORS, formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'
import {
  PROVIDER_AXIS_LOGO_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'

interface Props {
  allocations: InvestmentCarryAllocation[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const MAX_CHART_HEIGHT = 384
const MAX_BAR_HEIGHT = 36
const AXIS_CHROME = 48
const BAND_PADDING = 0.2

const chartHeight = computed(() => {
  const count = props.allocations.length
  if (count === 0) return AXIS_CHROME + MAX_BAR_HEIGHT
  const plotHeight = (MAX_BAR_HEIGHT * (count + BAND_PADDING)) / (1 - BAND_PADDING)
  return Math.min(MAX_CHART_HEIGHT, Math.round(AXIS_CHROME + plotHeight))
})

const logos = computed(() =>
  providerLogoMap(
    props.allocations.map((allocation) => ({ name: allocation.label, logo: allocation.logo })),
  ),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'after')

interface AllocationRow {
  label: string
  initialAmount: number
  tna: number
  tope: number | null
  color: string
}

const definition = computed(() => {
  if (!props.allocations.length) return null

  const rows: AllocationRow[] = props.allocations.map((allocation, index) => ({
    label: allocation.label,
    initialAmount: allocation.initialAmount,
    tna: allocation.tna,
    tope: allocation.tope,
    color: allocation.isCashReserve ? '#94a3b8' : CHART_COLORS[index % CHART_COLORS.length]!,
  }))
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }

  return defineChart(
    {
      marks: [
        barX(rows, {
          y: 'label',
          x: 'initialAmount',
          fill: (row) => row.color,
          radius: 6,
        }),
        decorative(
          text(rows, {
            x: 'initialAmount',
            y: 'label',
            text: (row) => formatCurrencyFull(row.initialAmount),
            anchor: 'start',
            dx: 6,
            fontSize: 10,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: 'Monto inicial',
            ticks: { format: (value: number) => formatCurrencyFull(value) },
          },
        },
        y: {
          scale: () => scaleBand<string>().padding(0.2),
          reverse: true,
          grid: false,
          axis: {
            tickLabels: {
              dx: ({ value }) => (logos.value.has(String(value)) ? PROVIDER_AXIS_LOGO_DX : 0),
            },
          },
        },
      },
      margin: { right: 96 },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
    },
    {
      tooltip: {
        use: tooltip,
        content: (points) => {
          const row = points[0]?.datum
          if (!row) return { rows: [] }
          return {
            title: row.label,
            rows: [
              { label: 'Asignado', value: formatCurrencyFull(row.initialAmount) },
              { label: 'TNA', value: `${(row.tna * 100).toFixed(2)}%` },
              {
                label: 'Tope',
                value: row.tope == null ? 'Sin límite' : formatCurrencyFull(row.tope),
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
  <div class="w-full" :style="{ height: `${chartHeight}px` }">
    <Chart
      v-if="definition"
      :definition="definition"
      aria-label="Asignación inicial del carry en contado con cuotas"
      class="h-full w-full"
      :height="chartHeight"
      @render="paintLogos"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">
      Sin datos para el gráfico.
    </div>
  </div>
</template>
