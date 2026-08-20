<script setup lang="ts">
import { provide } from 'vue'
import type { FciFundHistoryItem } from '~/composables/useFciFundDetails'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import { formatCompactNumber, formatDecimal, formatPercentAuto } from '~/lib/fci-fund-formatters'

type SeriesKey = 'vcp' | 'patrimonio' | 'retornoAcumulado' | 'retornoDiario' | 'flujo'

const props = defineProps<{
  points: FciFundHistoryItem[]
  loading?: boolean
}>()

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  height: 360,
  width: 'auto',
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

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
    color: CHART_COLORS[1],
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'patrimonio',
    label: 'Patrimonio',
    shortLabel: 'Patrimonio',
    color: CHART_COLORS[0],
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'retornoAcumulado',
    label: 'Retorno acumulado',
    shortLabel: 'Acumulado',
    color: CHART_COLORS[4],
    chartType: 'line',
    useArea: true,
  },
  {
    key: 'retornoDiario',
    label: 'Retorno diario',
    shortLabel: 'Diario',
    color: CHART_COLORS[2],
    chartType: 'bar',
    useArea: false,
  },
  {
    key: 'flujo',
    label: 'Flujo estimado',
    shortLabel: 'Flujo',
    color: CHART_COLORS[6],
    chartType: 'bar',
    useArea: false,
  },
]

const selectedSeries = ref<SeriesKey>('vcp')

const chronologicalPoints = computed(() => {
  return [...props.points].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
})

const activeSeries = computed(
  () => seriesOptions.find((item) => item.key === selectedSeries.value) ?? seriesOptions[0],
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

const seriesData = computed<Array<[number, number]>>(() => {
  return chartPoints.value.map((point) => {
    const value = readSeriesValue(point, selectedSeries.value) as number
    return [Date.parse(`${point.fecha}T00:00:00.000Z`), value]
  })
})

const chartOption = computed(() => {
  if (!seriesData.value.length) return {}

  const series = activeSeries.value
  const isDark = colorMode.value === 'dark'

  return {
    backgroundColor: 'transparent',
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params
        if (!item) return ''

        const timestamp = item.value?.[0] ?? item.axisValue
        const date =
          typeof timestamp === 'number' ? new Date(timestamp) : new Date(String(timestamp))
        const point = chartPoints.value.find(
          (row) => Date.parse(`${row.fecha}T00:00:00.000Z`) === date.getTime(),
        )

        const lines = [
          `<strong>${date.toLocaleDateString('es-AR')}</strong>`,
          `${item.marker || ''} ${series.label}: ${formatTooltipValue(item.value?.[1])}`,
        ]

        if (point && selectedSeries.value !== 'vcp' && point.valorCuotaparte != null) {
          lines.push(`VCP: ${formatDecimal(point.valorCuotaparte)}`)
        }
        if (point && selectedSeries.value !== 'patrimonio' && point.patrimonio != null) {
          lines.push(`Patrimonio: ${formatCurrency(point.patrimonio)}`)
        }

        return lines.join('<br/>')
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '14%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: series.chartType === 'bar',
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => {
          const date = new Date(value)
          return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        },
      },
      axisLine: {
        lineStyle: { color: gridLineColor.value },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel.value,
      nameTextStyle: { color: textColor.value },
      scale: true,
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => formatAxisValue(value),
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: gridLineColor.value,
          type: 'dashed',
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        filterMode: 'none',
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        height: 18,
        bottom: 8,
        start: 0,
        end: 100,
        filterMode: 'none',
        borderColor: gridLineColor.value,
        fillerColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
        handleStyle: {
          color: series.color,
        },
        textStyle: {
          color: textColor.value,
        },
      },
    ],
    series: [
      {
        name: series.label,
        type: series.chartType,
        data: seriesData.value,
        smooth: series.chartType === 'line',
        showSymbol: false,
        sampling: 'lttb',
        barMaxWidth: 18,
        itemStyle: {
          color: series.color,
        },
        lineStyle:
          series.chartType === 'line'
            ? {
                color: series.color,
                width: 2,
              }
            : undefined,
        areaStyle: series.useArea
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${series.color}55` },
                  { offset: 1, color: `${series.color}05` },
                ],
              },
            }
          : undefined,
      },
    ],
  }
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

      <div v-if="props.loading && !seriesData.length" class="flex h-80 items-center justify-center">
        <div class="text-center text-sm text-neutral-500">
          <UIcon name="i-lucide-loader-2" class="mx-auto mb-2 h-8 w-8 animate-spin" />
          Cargando evolución…
        </div>
      </div>

      <ClientOnly v-else-if="seriesData.length">
        <VChart :option="chartOption" class="h-80 w-full" autoresize />
      </ClientOnly>

      <div v-else class="flex h-80 items-center justify-center text-sm text-neutral-500">
        No hay datos suficientes para graficar esta serie.
      </div>
    </UCard>
  </div>
</template>
