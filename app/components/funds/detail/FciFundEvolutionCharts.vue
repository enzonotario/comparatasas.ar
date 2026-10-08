<script setup lang="ts">
import { areaY, barY, defineChart, lineY } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { scaleUtc } from 'd3-scale'
import type { FciFundHistoryItem } from '~/composables/useFciFundDetails'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber, formatDecimal, formatPercentAuto } from '~/lib/fci-fund-formatters'

type SeriesKey = 'vcp' | 'patrimonio' | 'retornoAcumulado' | 'retornoDiario' | 'flujo'

const props = defineProps<{
  points: FciFundHistoryItem[]
  loading?: boolean
}>()

const { textColor, gridLineColor } = useChartTheme()

const seriesOptions: Array<{
  key: SeriesKey
  label: string
  shortLabel: string
  color: string
  chartType: 'line' | 'bar'
  useArea: boolean
}> = [
  {
    key: 'vcp',
    label: 'Valor cuotaparte',
    shortLabel: 'VCP',
    color: CHART_COLORS[1]!,
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'patrimonio',
    label: 'Patrimonio',
    shortLabel: 'Patrimonio',
    color: CHART_COLORS[0]!,
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'retornoAcumulado',
    label: 'Retorno acumulado',
    shortLabel: 'Acumulado',
    color: CHART_COLORS[4]!,
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'retornoDiario',
    label: 'Retorno diario',
    shortLabel: 'Diario',
    color: CHART_COLORS[2]!,
    chartType: 'bar',
    useArea: false,
  },
  {
    key: 'flujo',
    label: 'Flujo estimado',
    shortLabel: 'Flujo',
    color: CHART_COLORS[6]!,
    chartType: 'bar',
    useArea: false,
  },
]

const selectedSeries = ref<SeriesKey>('vcp')

const chronologicalPoints = computed(() => {
  return [...props.points].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
})

const activeSeries = computed(
  () => seriesOptions.find((item) => item.key === selectedSeries.value) ?? seriesOptions[0]!,
)

function readSeriesValue(point: FciFundHistoryItem, key: SeriesKey): number | null {
  switch (key) {
    case 'vcp':
      return point.valorCuotaparte
    case 'patrimonio':
      return point.patrimonio
    case 'retornoAcumulado':
      return point.retornoAcumulado
    case 'retornoDiario':
      return point.retornoDiario
    case 'flujo':
      return point.flujoEstimado
    default:
      return null
  }
}

const chartPoints = computed(() => {
  return chronologicalPoints.value.filter((point) => {
    const value = readSeriesValue(point, selectedSeries.value)
    return value != null && Number.isFinite(value)
  })
})

function formatAxisValue(value: number) {
  if (selectedSeries.value === 'vcp') return formatDecimal(value, 2)
  if (selectedSeries.value === 'patrimonio' || selectedSeries.value === 'flujo') {
    return formatCompactNumber(value)
  }
  return formatPercentAuto(value)
}

function formatTooltipValue(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—'
  if (selectedSeries.value === 'vcp') return formatDecimal(value)
  if (selectedSeries.value === 'patrimonio') return formatCurrency(value)
  if (selectedSeries.value === 'flujo') return formatCurrency(value)
  return formatPercentAuto(value)
}

const yAxisLabel = computed(() => {
  switch (selectedSeries.value) {
    case 'vcp':
      return 'VCP'
    case 'patrimonio':
      return 'Patrimonio'
    case 'retornoAcumulado':
      return 'Retorno acum. (%)'
    case 'retornoDiario':
      return 'Retorno diario (%)'
    case 'flujo':
      return 'Flujo estimado'
    default:
      return ''
  }
})

interface EvolutionRow {
  date: Date
  value: number
  valorCuotaparte: number | null
  patrimonio: number | null
}

function seriesExtent(values: readonly number[]): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (min === max) {
    const offset = Math.abs(min) * 0.05 || 1
    return [min - offset, max + offset]
  }
  return [min, max]
}

function formatAxisDate(date: Date) {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const definition = computed(() => {
  const series = activeSeries.value
  const rows: EvolutionRow[] = chartPoints.value.map((point) => ({
    date: new Date(Date.parse(`${point.fecha}T00:00:00.000Z`)),
    value: readSeriesValue(point, selectedSeries.value) as number,
    valorCuotaparte: point.valorCuotaparte,
    patrimonio: point.patrimonio,
  }))
  const theme = {
    foreground: textColor.value,
    muted: textColor.value,
    grid: gridLineColor.value,
    background: 'transparent',
    palette: CHART_COLORS,
  }
  const scales = {
    x: {
      scale: scaleUtc,
      nice: true,
      grid: false,
      axis: {
        line: { stroke: gridLineColor.value },
        ticks: { format: formatAxisDate },
        tickLabels: { thin: true },
      },
    },
    y: {
      scale: scaleLinear().domain(seriesExtent(rows.map((row) => row.value))),
      nice: true,
      grid: { stroke: gridLineColor.value, strokeDasharray: '4 4' },
      axis: {
        line: false,
        label: yAxisLabel.value,
        ticks: {
          format: (value: number) => formatAxisValue(value),
        },
      },
    },
  }
  const tooltipOptions = {
    use: tooltip,
    content: (
      points: readonly { datum: EvolutionRow; xValue: unknown; yValue: unknown; color: string }[],
    ) => {
      const point = points[0]
      if (!point) return { rows: [] }
      const date = point.xValue instanceof Date ? point.xValue : point.datum.date
      const value = typeof point.yValue === 'number' ? point.yValue : point.datum.value
      const tooltipRows = [
        {
          label: series.label,
          value: formatTooltipValue(value),
          color: series.color,
        },
      ]
      if (selectedSeries.value !== 'vcp' && point.datum.valorCuotaparte != null) {
        tooltipRows.push({
          label: 'VCP',
          value: formatDecimal(point.datum.valorCuotaparte),
          color: series.color,
        })
      }
      if (selectedSeries.value !== 'patrimonio' && point.datum.patrimonio != null) {
        tooltipRows.push({
          label: 'Patrimonio',
          value: formatCurrency(point.datum.patrimonio),
          color: series.color,
        })
      }
      return {
        title: date.toLocaleDateString('es-AR'),
        rows: tooltipRows,
      }
    },
  }

  if (series.chartType === 'bar') {
    return defineChart(
      {
        marks: [
          barY(rows, {
            x: 'date',
            y: 'value',
            key: (row) => row.date.getTime(),
            fill: series.color,
            maxThickness: 18,
            radius: { end: 4 },
          }),
        ],
        scales,
        clip: true,
        theme,
      },
      {
        focus: 'group-x',
        maxFocusDistance: Number.POSITIVE_INFINITY,
        tooltip: tooltipOptions,
      },
    )
  }

  return defineChart(
    {
      marks: [
        ...(series.useArea
          ? [
              decorative(
                areaY(rows, {
                  x: 'date',
                  y: 'value',
                  fill: 'url(#series-fill)',
                }),
              ),
            ]
          : []),
        lineY(rows, {
          x: 'date',
          y: 'value',
          key: (row) => row.date.getTime(),
          stroke: series.color,
          strokeWidth: 2,
        }),
      ],
      scales,
      clip: true,
      gradients: series.useArea
        ? [
            {
              id: 'series-fill',
              x1: 0,
              y1: 1,
              x2: 0,
              y2: 0,
              stops: [
                { offset: 0, color: series.color, opacity: 0.02 },
                { offset: 1, color: series.color, opacity: 0.33 },
              ],
            },
          ]
        : undefined,
      theme,
    },
    {
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: tooltipOptions,
    },
  )
})

const availableSeriesKeys = computed(() => {
  return new Set(
    seriesOptions
      .filter((option) =>
        chronologicalPoints.value.some((point) => {
          const value = readSeriesValue(point, option.key)
          return value != null && Number.isFinite(value)
        }),
      )
      .map((option) => option.key),
  )
})

const visibleSeriesOptions = computed(() =>
  seriesOptions.filter((option) => availableSeriesKeys.value.has(option.key)),
)

watch(
  visibleSeriesOptions,
  (options) => {
    if (!options.some((option) => option.key === selectedSeries.value)) {
      selectedSeries.value = options[0]?.key ?? 'vcp'
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <UCard
      :ui="{
        body: 'p-0!',
      }"
    >
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold">Evolución histórica</h2>
            <p class="text-sm text-neutral-500">
              Serie diaria del fondo · {{ chronologicalPoints.length }} puntos
            </p>
          </div>

          <UFieldGroup v-if="visibleSeriesOptions.length" size="sm" class="flex-wrap">
            <UButton
              v-for="option in visibleSeriesOptions"
              :key="option.key"
              size="sm"
              color="neutral"
              :variant="selectedSeries === option.key ? 'solid' : 'outline'"
              :label="option.shortLabel"
              @click="selectedSeries = option.key"
            />
          </UFieldGroup>
        </div>
      </template>

      <div
        v-if="props.loading && !chartPoints.length"
        class="flex h-80 items-center justify-center"
      >
        <div class="text-center text-sm text-neutral-500">
          <UIcon name="i-lucide-loader-2" class="mx-auto mb-2 h-8 w-8 animate-spin" />
          Cargando evolución…
        </div>
      </div>

      <ClientOnly v-else-if="chartPoints.length">
        <Chart
          :definition="definition"
          aria-label="Evolución histórica del fondo"
          class="h-80 w-full"
          :style="{ height: '100%' }"
        />
      </ClientOnly>

      <div v-else class="flex h-80 items-center justify-center text-sm text-neutral-500">
        No hay datos suficientes para graficar esta serie.
      </div>
    </UCard>
  </div>
</template>
