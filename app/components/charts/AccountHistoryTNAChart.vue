<script setup lang="ts">
import { provide } from 'vue'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  DataZoomComponentOption,
  GridComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import {
  dataZoomPercentToZoomRange,
  isFullDataZoomPercent,
  zoomRangeToDataZoomPercent,
  type ChartZoomRange,
} from '~/composables/useAccountHistoryChartZoomSync'
import { formatCurrency, useChartTheme } from '~/composables/useChartConfig'

type ChartOption = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption | DataZoomComponentOption
>

interface Props {
  history: AccountHistoryItem[]
  providerName: string
  /** Rango de zoom sincronizado (índices del historial; end exclusivo). */
  zoomRange?: ChartZoomRange | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  zoomStart: [payload: { index: number }]
  zoomEnd: [payload: { index: number }]
  zoomReset: []
}>()

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  height: 384,
  width: 'auto' as const,
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

const { textColor, gridLineColor } = useChartTheme()

const SERIES_COLOR = '#3b82f6'

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const xLabels = computed(() => props.history.map((item) => formatShortDate(item.fecha)))
const tnaValues = computed(() => props.history.map((item) => item.tna * 100))

const dataZoomWindow = computed(() =>
  zoomRangeToDataZoomPercent(props.zoomRange, props.history.length),
)

const chartOption = computed<ChartOption>(() => {
  if (!props.history.length) return {}

  const isDark = colorMode.value === 'dark'
  const { start, end } = dataZoomWindow.value

  return {
    backgroundColor: 'transparent',
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        if (!item || typeof item !== 'object') return ''
        const dataIndex = (item as { dataIndex?: number }).dataIndex ?? 0
        const point = props.history[dataIndex]
        const label = xLabels.value[dataIndex] ?? ''
        if (!point) return ''
        const y = (point.tna * 100).toFixed(2)
        const topeText = point.tope
          ? `Tope: ${formatCurrency(point.tope)}`
          : 'Tope: Sin límite'
        return `<strong>${label}</strong><br/>TNA: ${y}%<br/>${topeText}`
      },
    },
    grid: {
      left: '2%',
      right: '3%',
      top: '12%',
      bottom: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      name: 'Fecha',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: textColor.value },
      data: xLabels.value,
      boundaryGap: false,
      axisLabel: {
        color: textColor.value,
        hideOverlap: true,
        rotate: 45,
        fontSize: 11,
      },
      axisLine: {
        lineStyle: { color: gridLineColor.value },
      },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'TNA (%)',
      nameTextStyle: { color: textColor.value },
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => `${Number(value).toFixed(1)}%`,
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
        start,
        end,
        filterMode: 'none',
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        height: 18,
        bottom: 8,
        start,
        end,
        filterMode: 'none',
        borderColor: gridLineColor.value,
        fillerColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
        handleStyle: { color: SERIES_COLOR },
        textStyle: { color: textColor.value },
        dataBackground: {
          lineStyle: { color: SERIES_COLOR },
          areaStyle: { color: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)' },
        },
        selectedDataBackground: {
          lineStyle: { color: SERIES_COLOR },
          areaStyle: { color: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.3)' },
        },
      },
    ],
    series: [
      {
        name: 'TNA',
        type: 'line',
        data: tnaValues.value,
        smooth: true,
        showSymbol: false,
        sampling: 'lttb',
        itemStyle: { color: SERIES_COLOR },
        lineStyle: { color: SERIES_COLOR, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${SERIES_COLOR}55` },
              { offset: 1, color: `${SERIES_COLOR}05` },
            ],
          },
        },
      },
    ],
  }
})

function readDataZoomPercents(event: {
  start?: number
  end?: number
  batch?: Array<{ start?: number; end?: number }>
}) {
  const payload = event.batch?.[0] ?? event
  return {
    start: payload.start ?? 0,
    end: payload.end ?? 100,
  }
}

function onDataZoom(event: {
  start?: number
  end?: number
  batch?: Array<{ start?: number; end?: number }>
}) {
  const length = props.history.length
  if (!length) return

  const { start, end } = readDataZoomPercents(event)
  if (isFullDataZoomPercent(start, end)) {
    if (props.zoomRange != null) emit('zoomReset')
    return
  }

  const next = dataZoomPercentToZoomRange(start, end, length)
  const prev = props.zoomRange
  if (prev && prev.start === next.start && prev.end === next.end) return

  emit('zoomStart', { index: next.start })
  emit('zoomEnd', { index: next.end })
}
</script>

<template>
  <ClientOnly>
    <div v-if="history.length > 0" class="h-96 w-full">
      <VChart :option="chartOption" class="h-full w-full" autoresize @datazoom="onDataZoom" />
    </div>
    <div v-else class="flex h-96 items-center justify-center text-sm text-neutral-500">
      Sin datos de historial.
    </div>
    <template #fallback>
      <div class="flex h-96 items-center justify-center text-neutral-500">Cargando gráfico…</div>
    </template>
  </ClientOnly>
</template>
