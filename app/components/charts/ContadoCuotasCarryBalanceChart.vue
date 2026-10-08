<script setup lang="ts">
import {
  areaY,
  colorLegend,
  colorLegendItems,
  defineChart,
  dot,
  lineY,
  stack,
} from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import type { InvestmentCarryPoint } from '~/lib/finance/contado-cuotas-carry'
import { CHART_COLORS, formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  points: InvestmentCarryPoint[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

interface BalanceRow {
  x: string
  seriesId: string
  seriesName: string
  value: number
  label: string
  cumulativePaid: number
  netOutcome: number
}

const DEUDA_ID = 'deuda-remanente'
const NETO_ID = 'resultado-neto'

const definition = computed(() => {
  if (!props.points.length) return null

  const uniqueBuckets = new Map<string, { label: string; isCashReserve?: boolean }>()
  for (const point of props.points) {
    for (const bucket of point.buckets) {
      if (!uniqueBuckets.has(bucket.id)) {
        uniqueBuckets.set(bucket.id, {
          label: bucket.label,
          isCashReserve: bucket.isCashReserve,
        })
      }
    }
  }

  const areaSeries = [...uniqueBuckets.entries()].map(([id, meta], index) => ({
    id,
    name: meta.label,
    color: meta.isCashReserve ? '#94a3b8' : CHART_COLORS[index % CHART_COLORS.length]!,
  }))

  const areaRows: BalanceRow[] = areaSeries.flatMap((series) =>
    props.points.map((point) => ({
      x: point.label,
      seriesId: series.id,
      seriesName: series.name,
      value: point.buckets.find((bucket) => bucket.id === series.id)?.balance ?? 0,
      label: point.label,
      cumulativePaid: point.cumulativePaid,
      netOutcome: point.netOutcome,
    })),
  )

  const deudaRows: BalanceRow[] = props.points.map((point) => ({
    x: point.label,
    seriesId: DEUDA_ID,
    seriesName: 'Deuda remanente',
    value: point.remainingLiability,
    label: point.label,
    cumulativePaid: point.cumulativePaid,
    netOutcome: point.netOutcome,
  }))

  const netoRows: BalanceRow[] = props.points.map((point) => ({
    x: point.label,
    seriesId: NETO_ID,
    seriesName: 'Resultado neto',
    value: point.netOutcome,
    label: point.label,
    cumulativePaid: point.cumulativePaid,
    netOutcome: point.netOutcome,
  }))

  const domain = [...areaSeries.map((series) => series.id), DEUDA_ID, NETO_ID]
  const range = [...areaSeries.map((series) => series.color), '#f59e0b', '#22c55e']
  const labels = new Map<string, string>([
    ...areaSeries.map((series) => [series.id, series.name] as const),
    [DEUDA_ID, 'Deuda remanente'],
    [NETO_ID, 'Resultado neto'],
  ])
  const lineIds = new Set([DEUDA_ID, NETO_ID])
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }

  return defineChart(
    {
      marks: [
        areaY(areaRows, {
          x: 'x',
          y: 'value',
          z: 'seriesId',
          color: 'seriesId',
          fillOpacity: 0.55,
          layout: stack({ order: areaSeries.map((series) => series.id) }),
        }),
        lineY(deudaRows, {
          x: 'x',
          y: 'value',
          z: 'seriesId',
          color: 'seriesId',
          strokeDasharray: '4 3',
          strokeWidth: 2,
        }),
        decorative(
          dot(deudaRows, {
            x: 'x',
            y: 'value',
            r: 3,
            color: 'seriesId',
          }),
        ),
        lineY(netoRows, {
          x: 'x',
          y: 'value',
          z: 'seriesId',
          color: 'seriesId',
          strokeWidth: 3,
        }),
        decorative(
          dot(netoRows, {
            x: 'x',
            y: 'value',
            r: 3,
            color: 'seriesId',
          }),
        ),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().padding(0.2),
          grid: false,
          axis: { tickLabels: { thin: true } },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: 'Saldo / deuda remanente',
            ticks: { format: (value: number) => formatCurrencyFull(value) },
          },
        },
      },
      color: {
        domain,
        range,
        legend: colorLegend({
          items: colorLegendItems({
            indicator: {
              shape: (value) => (lineIds.has(String(value)) ? 'line' : 'square'),
            },
            label: {
              format: (value) => labels.get(String(value)) ?? String(value),
            },
          }),
        }),
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
    },
    {
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points, context) => {
          const first = points[0]?.datum
          if (!first) return { rows: [] }
          return {
            title: first.label,
            rows: [
              ...points
                .filter((point) => point.datum.value !== 0)
                .map((point) => ({
                  label: point.datum.seriesName,
                  value: formatCurrencyFull(point.datum.value),
                  color: point.color,
                  active: point === context.primaryPoint,
                })),
              { label: 'Pago acumulado', value: formatCurrencyFull(first.cumulativePaid) },
              { label: 'Resultado neto', value: formatCurrencyFull(first.netOutcome) },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full" style="height: 28rem; min-height: 448px">
    <Chart
      v-if="definition"
      :definition="definition"
      aria-label="Evolución de saldos y deuda del carry"
      class="h-full w-full"
      :height="448"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">
      Sin datos para el gráfico.
    </div>
  </div>
</template>
