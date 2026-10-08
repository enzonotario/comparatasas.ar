<script setup lang="ts">
import { areaY, defineChart, lineY } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { controlledSignal } from '@tanstack/charts/interaction/signal'
import { zoomX } from '@tanstack/charts/interaction/zoom'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { scaleUtc } from 'd3-scale'
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import {
  filterHistoryWithTope,
  historyDateExtent,
  parseHistoryDate,
  type ChartDateWindow,
  useZoomPlotHover,
} from '~/composables/useAccountHistoryChartZoomSync'
import { formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
  /** Misma ventana de fechas que el gráfico de TNA. No se reinterpreta sobre la serie filtrada. */
  zoomWindow?: ChartDateWindow | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:zoomWindow': [window: ChartDateWindow]
}>()

const { textColor, gridLineColor } = useChartTheme()
const { onRender: onZoomPlotHover } = useZoomPlotHover()

const SERIES_COLOR = '#10b981'

const shortDate = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  timeZone: 'UTC',
})

function formatShortDate(value: string | Date) {
  const date = value instanceof Date ? value : parseHistoryDate(value)
  return shortDate.format(date)
}

function paddedDomain(values: readonly number[]): [number, number] {
  if (!values.length) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1
    return [min - pad, max + pad]
  }
  const pad = (max - min) * 0.1
  const lower = min >= 0 ? Math.max(0, min - pad) : min - pad
  return [lower, max + pad]
}

const filtered = computed(() => filterHistoryWithTope(props.history))
const extent = computed(() => historyDateExtent(props.history))

const window = computed(() => {
  if (props.zoomWindow) return props.zoomWindow
  const dates = extent.value
  if (!dates) return null
  return { start: dates[0], end: dates[1] }
})

const definition = computed(() => {
  const rows = filtered.value
  const current = window.value
  const dates = extent.value
  if (!rows.length || !current || !dates) return null

  const yValues = rows.map((item) => item.tope ?? 0)
  const [yMin, yMax] = paddedDomain(yValues)
  const xScale = scaleUtc().domain([current.start, current.end])

  return defineChart(
    {
      clip: true,
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
      gradients: [
        {
          id: 'tope-area-fill',
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
          stops: [
            { offset: 0, color: SERIES_COLOR, opacity: 0.33 },
            { offset: 1, color: SERIES_COLOR, opacity: 0.02 },
          ],
        },
      ],
      marks: [
        decorative(
          areaY(rows, {
            x: (row) => parseHistoryDate(row.fecha),
            y1: yMin,
            y2: (row) => row.tope ?? 0,
            fill: 'url(#tope-area-fill)',
            key: (row) => row.fecha,
          }),
        ),
        lineY(rows, {
          x: (row) => parseHistoryDate(row.fecha),
          y: (row) => row.tope ?? 0,
          stroke: SERIES_COLOR,
          strokeWidth: 2,
          key: (row) => row.fecha,
        }),
      ],
      scales: {
        x: {
          scale: xScale,
          grid: false,
          axis: {
            label: { text: 'Fecha', fill: textColor.value },
            line: { stroke: gridLineColor.value },
            ticks: { format: (value: Date) => formatShortDate(value) },
            tickLabels: { rotate: 45, fontSize: 11, thin: true },
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid: { stroke: gridLineColor.value, strokeDasharray: '4 4' },
          axis: {
            label: { text: 'Tope (ARS)', fill: textColor.value },
            line: false,
            ticks: { format: (value: number) => formatCurrency(Number(value)) },
          },
        },
      },
      controls: [
        zoomX({
          window: controlledSignal(current, (next) => {
            emit('update:zoomWindow', { start: next.start, end: next.end })
          }),
          extent: [dates[0], dates[1]],
          ariaLabel: `Período visible del historial de tope de ${props.providerName}`,
          format: (value) => formatShortDate(value),
        }),
      ],
    },
    {
      focus: 'nearest-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const row = points[0]?.datum as AccountHistoryItem | undefined
          if (!row || row.tope == null) return { rows: [] }
          return {
            title: formatShortDate(row.fecha),
            color: SERIES_COLOR,
            rows: [
              { label: 'Tope', value: formatCurrency(row.tope) },
              { label: 'TNA', value: `${(row.tna * 100).toFixed(2)}%` },
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
    <div v-if="filtered.length > 0 && definition" class="h-96 w-full">
      <Chart
        :definition="definition"
        :aria-label="`Evolución de tope de ${providerName}`"
        id-prefix="account-history-tope"
        :height="384"
        class="h-full w-full"
        @render="onZoomPlotHover"
      />
    </div>
    <div v-else class="flex h-96 items-center justify-center text-sm text-neutral-500">
      No hay datos de tope disponibles.
    </div>
    <template #fallback>
      <div class="flex h-96 items-center justify-center text-neutral-500">Cargando gráfico…</div>
    </template>
  </ClientOnly>
</template>
