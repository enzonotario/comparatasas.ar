<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { useRouteQuery } from '@vueuse/router'
import { scaleUtc } from 'd3-scale'
import type { FciFundHistoryItem } from '~/composables/useFciFundDetails'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import {
  prepareFciCompareChartSeries,
  type FciCompareChartSeriesKey,
} from '~/lib/fci-fund-compare-chart'
import { formatCompactNumber, formatPercentAuto, metricTone } from '~/lib/fci-fund-formatters'
import {
  DEFAULT_FUND_HISTORY_PERIOD,
  fundHistoryPeriodLabel,
  isFundHistoryPeriod,
  type FundHistoryPeriod,
} from '~/lib/funds-detail'
import { providerLogoMap, useProviderLogos } from '~/lib/charts/provider-logos'

const props = defineProps<{
  funds: Array<{
    key: string
    label: string
    points: FciFundHistoryItem[]
    logo?: string
  }>
  loading?: boolean
}>()

const { textColor, gridLineColor } = useChartTheme()

const periodoQuery = useRouteQuery<string | undefined>('periodo', undefined)
const selectedPeriod = computed({
  get: (): FundHistoryPeriod =>
    isFundHistoryPeriod(periodoQuery.value) ? periodoQuery.value : DEFAULT_FUND_HISTORY_PERIOD,
  set: (value: string | number) => {
    const period = isFundHistoryPeriod(value) ? value : DEFAULT_FUND_HISTORY_PERIOD
    periodoQuery.value = period === DEFAULT_FUND_HISTORY_PERIOD ? undefined : period
  },
})

const periodItems: TabsItem[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1A', value: '1y' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Todo', value: 'all' },
]

const selectedSeries = ref<FciCompareChartSeriesKey>('retorno')

const seriesOptions: Array<{
  key: FciCompareChartSeriesKey
  label: string
  shortLabel: string
}> = [
  { key: 'retorno', label: 'Retorno acumulado', shortLabel: 'Retorno' },
  { key: 'patrimonio', label: 'Patrimonio', shortLabel: 'Patrimonio' },
  { key: 'vcp', label: 'VCP indexado (base 100)', shortLabel: 'VCP' },
]

const logos = computed(() =>
  providerLogoMap(props.funds.map((fund) => ({ name: fund.label, logo: fund.logo }))),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'after')

const coloredFunds = computed(() =>
  props.funds.map((fund, index) => ({
    ...fund,
    color: CHART_COLORS[index % CHART_COLORS.length]!,
  })),
)

const preparedSeries = computed(() =>
  prepareFciCompareChartSeries(coloredFunds.value, selectedPeriod.value, selectedSeries.value),
)

const activeSeriesMeta = computed(
  () => seriesOptions.find((item) => item.key === selectedSeries.value) ?? seriesOptions[0]!,
)

function formatAxisValue(value: number) {
  if (selectedSeries.value === 'patrimonio') return formatCompactNumber(value)
  if (selectedSeries.value === 'vcp') return value.toFixed(0)
  return formatPercentAuto(value)
}

function formatTooltipValue(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  if (selectedSeries.value === 'patrimonio') return formatCurrency(value)
  if (selectedSeries.value === 'vcp') return value.toFixed(2)
  return formatPercentAuto(value)
}

function formatLatestValue(value: number | null) {
  return formatTooltipValue(value)
}

function formatAxisDate(date: Date) {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

interface CompareRow {
  series: string
  date: Date
  value: number
}

const definition = computed(() => {
  const series = preparedSeries.value
  const rows: CompareRow[] = series.flatMap((item) =>
    item.points.map((point) => ({
      series: item.label,
      date: new Date(point.timestamp),
      value: point.value,
    })),
  )

  return defineChart(
    {
      marks: [
        lineY(rows, {
          x: 'date',
          y: 'value',
          z: 'series',
          strokeWidth: 2,
          key: (row) => `${row.series}:${row.date.getTime()}`,
        }),
      ],
      scales: {
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
          scale: scaleLinear,
          nice: true,
          grid: { stroke: gridLineColor.value, strokeDasharray: '4 4' },
          axis: {
            line: false,
            label: activeSeriesMeta.value.label,
            ticks: {
              format: (value: number) => formatAxisValue(value),
            },
          },
        },
      },
      color: {
        scale: scaleOrdinal<string, string>()
          .domain(series.map((item) => item.label))
          .range(series.map((item) => item.color)),
        legend: colorLegend(),
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
        palette: CHART_COLORS,
      },
    },
    {
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const first = points[0]
          const date = first?.xValue
          return {
            title: date instanceof Date ? date.toLocaleDateString('es-AR') : '',
            rows: points.map((point) => ({
              label: point.groupLabel,
              value: formatTooltipValue(typeof point.yValue === 'number' ? point.yValue : null),
              color: point.color,
            })),
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">Evolución comparada</p>
        <p class="text-xs text-muted">Mostrando {{ fundHistoryPeriodLabel(selectedPeriod) }}</p>
      </div>

      <UTabs
        v-model="selectedPeriod"
        :items="periodItems"
        :content="false"
        color="neutral"
        size="xs"
        class="w-full sm:w-auto overflow-x-auto"
        :ui="{
          list: 'inline-flex w-max min-w-full sm:min-w-0',
          trigger: 'px-2.5',
        }"
      />
    </div>

    <div v-if="preparedSeries.length" class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div
        v-for="series in preparedSeries"
        :key="series.key"
        class="rounded-xl border border-default bg-elevated/40 px-3 py-3 min-w-0"
      >
        <div class="flex items-center gap-1.5 mb-1 min-w-0">
          <span class="size-2 rounded-full shrink-0" :style="{ background: series.color }" />
          <p class="text-[10px] uppercase tracking-wide text-muted truncate">{{ series.label }}</p>
        </div>
        <p
          class="text-lg font-semibold tabular-nums truncate"
          :class="
            selectedSeries === 'retorno' ? metricTone(series.latestValue) : 'text-highlighted'
          "
        >
          {{ formatLatestValue(series.latestValue) }}
        </p>
        <p class="text-xs text-muted truncate">{{ activeSeriesMeta.shortLabel }} en el período</p>
      </div>
    </div>

    <UCard
      :ui="{
        body: 'p-0!',
      }"
    >
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">{{ activeSeriesMeta.label }}</h2>
            <p class="text-sm text-muted">
              <template v-if="selectedSeries === 'vcp'">
                Indexado en 100 al inicio del período para comparar fondos.
              </template>
              <template v-else-if="selectedSeries === 'retorno'">
                Retorno acumulado recalculado desde el inicio del período.
              </template>
              <template v-else> Patrimonio de la clase principal de cada fondo. </template>
            </p>
          </div>

          <UFieldGroup size="sm" class="flex-wrap">
            <UButton
              v-for="option in seriesOptions"
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
        v-if="props.loading && !preparedSeries.length"
        class="flex h-80 items-center justify-center"
      >
        <div class="text-center text-sm text-muted">
          <UIcon name="i-lucide-loader-2" class="mx-auto mb-2 h-8 w-8 animate-spin" />
          Cargando evolución…
        </div>
      </div>

      <ClientOnly v-else-if="preparedSeries.length">
        <Chart
          :definition="definition"
          aria-label="Evolución comparada de fondos"
          class="h-80 w-full"
          :style="{ height: '100%' }"
          @render="paintLogos"
        />
      </ClientOnly>

      <div v-else class="flex h-80 items-center justify-center text-sm text-muted">
        No hay histórico suficiente para graficar estos fondos.
      </div>
    </UCard>
  </div>
</template>
