<script setup lang="ts">
import { provide } from 'vue'
import type { TabsItem } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'
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

const props = defineProps<{
  funds: Array<{
    key: string
    label: string
    points: FciFundHistoryItem[]
  }>
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

const chartOption = computed(() => {
  if (!preparedSeries.value.length) return {}

  const isDark = colorMode.value === 'dark'

  return {
    backgroundColor: 'transparent',
    animationDuration: 300,
    legend: {
      top: 0,
      textStyle: { color: textColor.value },
      data: preparedSeries.value.map((series) => series.label),
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params]
        if (!items.length) return ''

        const timestamp = items[0]?.value?.[0] ?? items[0]?.axisValue
        const date =
          typeof timestamp === 'number' ? new Date(timestamp) : new Date(String(timestamp))

        const lines = [`<strong>${date.toLocaleDateString('es-AR')}</strong>`]
        for (const item of items) {
          lines.push(
            `${item.marker || ''} ${item.seriesName}: ${formatTooltipValue(item.value?.[1])}`,
          )
        }
        return lines.join('<br/>')
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '14%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
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
      name: activeSeriesMeta.value.label,
      nameTextStyle: { color: textColor.value },
      scale: true,
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => formatAxisValue(value),
      },
      axisLine: { show: false },
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
          color: CHART_COLORS[1],
        },
        textStyle: {
          color: textColor.value,
        },
      },
    ],
    series: preparedSeries.value.map((series) => ({
      name: series.label,
      type: 'line' as const,
      data: series.points.map((point) => [point.timestamp, point.value] as [number, number]),
      smooth: true,
      showSymbol: false,
      sampling: 'lttb',
      itemStyle: { color: series.color },
      lineStyle: { color: series.color, width: 2 },
    })),
  }
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
        <VChart :option="chartOption" class="h-80 w-full" autoresize />
      </ClientOnly>

      <div v-else class="flex h-80 items-center justify-center text-sm text-muted">
        No hay histórico suficiente para graficar estos fondos.
      </div>
    </UCard>
  </div>
</template>
