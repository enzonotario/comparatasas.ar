<script setup lang="ts">
import { defineChart, rect, ruleX, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import type { PlazoFijoUvaPagoPeriodicoItem } from '~/composables/usePlazosFijosUvaPagoPeriodico'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  items: PlazoFijoUvaPagoPeriodicoItem[]
  /** Días del simulador. `null` cuando el simulador está cerrado. */
  selectedDays: number | null
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const bounds = computed(() => {
  const rows = props.items.filter((item) => item.tna > 0)
  if (!rows.length) return null
  const minD = Math.min(...rows.map((row) => row.plazoMinDias))
  const maxD = Math.max(...rows.map((row) => row.plazoMaxDias))
  const minT = Math.min(...rows.map((row) => row.tna))
  const maxT = Math.max(...rows.map((row) => row.tna))
  const spanT = maxT - minT || 1
  const padT = Math.max(0.25, spanT * 0.12)
  return {
    minD,
    maxD,
    minY: Math.max(0, minT - padT),
    maxY: maxT + padT,
  }
})

const rowsSorted = computed(() => {
  const rows = props.items.filter((item) => item.tna > 0)
  return [...rows].sort(
    (a, z) =>
      a.plazoMinDias - z.plazoMinDias || a.institution.localeCompare(z.institution, 'es-AR'),
  )
})

const yTicks = computed(() => {
  const current = bounds.value
  if (!current) return []
  const n = 5
  const ticks: number[] = []
  for (let i = 0; i <= n; i++) {
    ticks.push(current.minY + (i / n) * (current.maxY - current.minY))
  }
  return ticks
})

const xTicks = computed(() => {
  const current = bounds.value
  if (!current) return []
  const target = 8
  const span = current.maxD - current.minD || 1
  const step = Math.max(30, Math.ceil(span / target / 30) * 30)
  const ticks: number[] = []
  for (let day = Math.ceil(current.minD / step) * step; day <= current.maxD; day += step) {
    ticks.push(day)
  }
  if (ticks.length === 0 || ticks[0]! > current.minD) ticks.unshift(current.minD)
  if (ticks[ticks.length - 1]! < current.maxD) ticks.push(current.maxD)
  return [...new Set(ticks)].sort((a, z) => a - z)
})

function fmtPct(n: number): string {
  return `${n.toFixed(n < 10 ? 2 : 1)}%`
}

interface LadderRow {
  rowKey: string
  institution: string
  plazoMinDias: number
  plazoMaxDias: number
  x2: number
  tna: number
  y1: number
  y2: number
  color: string
}

const definition = computed(() => {
  const current = bounds.value
  const source = rowsSorted.value
  if (!current || !source.length) return null

  const spanX = current.maxD - current.minD || 1
  const spanY = current.maxY - current.minY || 1
  const minWidth = Math.max(spanX * 0.012, 1)
  const half = Math.max(spanY * 0.015, 0.04)
  const rows: LadderRow[] = source.map((row, index) => ({
    rowKey: row.rowKey,
    institution: row.institution,
    plazoMinDias: row.plazoMinDias,
    plazoMaxDias: row.plazoMaxDias,
    x2: row.plazoMaxDias <= row.plazoMinDias ? row.plazoMinDias + minWidth : row.plazoMaxDias,
    tna: row.tna,
    y1: row.tna - half,
    y2: row.tna + half,
    color: CHART_COLORS[index % CHART_COLORS.length]!,
  }))
  const selected = props.selectedDays
  const showSim = selected != null && selected >= current.minD && selected <= current.maxD
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }

  return defineChart(
    {
      marks: [
        ...(selected != null && showSim
          ? [
              decorative(
                ruleX([selected], {
                  stroke: '#6366f1',
                  strokeWidth: 1.5,
                  strokeDasharray: '5 4',
                  strokeOpacity: 0.85,
                }),
              ),
            ]
          : []),
        rect(rows, {
          x1: 'plazoMinDias',
          x2: 'x2',
          y1: 'y1',
          y2: 'y2',
          color: 'rowKey',
          radius: 6,
        }),
        decorative(
          text(rows, {
            x: (row) => (row.plazoMinDias + row.plazoMaxDias) / 2,
            y: 'y2',
            text: (row) => fmtPct(row.tna),
            anchor: 'middle',
            dy: -18,
            fontSize: 11,
            fontWeight: 600,
            fill: textColor.value,
          }),
        ),
        decorative(
          text(rows, {
            x: (row) => (row.plazoMinDias + row.plazoMaxDias) / 2,
            y: 'y2',
            text: (row) => `${row.plazoMinDias}–${row.plazoMaxDias} d`,
            anchor: 'middle',
            dy: -6,
            fontSize: 10,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([current.minD, current.maxD]),
          grid: false,
          axis: {
            label: 'Días de plazo',
            ticks: {
              values: xTicks.value,
              format: (value: number) => String(Math.round(value)),
            },
            tickLabels: { thin: false },
          },
        },
        y: {
          scale: scaleLinear().domain([current.minY, current.maxY]),
          grid,
          axis: {
            label: 'TNA (%)',
            ticks: {
              values: yTicks.value,
              format: (value: number) => fmtPct(value),
            },
            tickLabels: { thin: false },
          },
        },
      },
      margin: { top: 36 },
      color: {
        domain: rows.map((row) => row.rowKey),
        range: rows.map((row) => row.color),
      },
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
        portal,
        content: (points) => {
          const row = points[0]?.datum
          if (!row || !('institution' in row)) return { rows: [] }
          return {
            title: row.institution,
            rows: [
              { label: 'TNA', value: fmtPct(row.tna) },
              { label: 'Plazo', value: `${row.plazoMinDias}–${row.plazoMaxDias} días` },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full min-w-0">
    <div
      v-if="definition"
      class="h-[500px] rounded-lg border border-neutral-200 bg-white/50 dark:border-neutral-700 dark:bg-neutral-900/30"
    >
      <Chart
        :definition="definition"
        aria-label="Gráfico escalera TNA por tramo de días"
        class="h-full w-full"
        :height="500"
      />
    </div>
    <p v-else class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
      No hay datos para el gráfico.
    </p>
  </div>
</template>
