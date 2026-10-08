<script setup lang="ts">
import { areaY, defineChart, dot, lineY, ruleY, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { crosshair } from '@tanstack/charts/crosshair'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import { scaleUtc } from 'd3-scale'
import { useChartTheme } from '~/composables/useChartConfig'
import {
  formatUvaDolarRatio,
  type UvaDolarPoderCompraPoint,
  type UvaDolarPoderCompraSeries,
} from '~/lib/finance/uva-dolar-poder-compra'

interface Props {
  series: UvaDolarPoderCompraSeries | null
  /** Etiqueta de la casa de dólar (p. ej. "Blue", "Oficial") */
  dolarLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  dolarLabel: 'dólar',
})

const colorMode = useColorMode()
const { textColor, gridLineColor } = useChartTheme()

const isDark = computed(() => colorMode.value === 'dark')

function ymdToUtcDate(ymd: string): Date {
  const [y = 1970, m = 1, d = 1] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatFechaCorta(ymd: string): string {
  const [yy, mm, dd] = ymd.split('-').map(Number)
  if (!yy || !mm || !dd) return ymd
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(yy, mm - 1, dd)))
}

function formatAxisDate(value: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(value)
}

function formatArs(value: number): string {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Un punto cada N días para no saturar el gráfico; siempre incluye max y último. */
function downsamplePoints(
  points: UvaDolarPoderCompraPoint[],
  stepDias: number,
  keepFechas: Set<string>,
): UvaDolarPoderCompraPoint[] {
  if (points.length <= 800 || stepDias <= 1) return points
  const out: UvaDolarPoderCompraPoint[] = []
  let lastKeptMs = -Infinity
  const stepMs = stepDias * 86400000
  for (const point of points) {
    const ms = ymdToUtcDate(point.fecha).getTime()
    if (keepFechas.has(point.fecha) || ms - lastKeptMs >= stepMs) {
      out.push(point)
      lastKeptMs = ms
    }
  }
  return out
}

interface RatioRow {
  date: Date
  fecha: string
  ratio: number
  uva: number
  dolarVenta: number
}

const definition = computed(() => {
  const series = props.series
  if (!series || series.points.length === 0) return null

  const avg = series.promedioHistorico
  const maxFecha = series.maximo?.fecha
  const lastFecha = series.ultimo?.fecha
  const keep = new Set([maxFecha, lastFecha].filter(Boolean) as string[])
  const sampled = downsamplePoints(series.points, 3, keep).map(
    (point): RatioRow => ({
      date: ymdToUtcDate(point.fecha),
      fecha: point.fecha,
      ratio: point.ratio,
      uva: point.uva,
      dolarVenta: point.dolarVenta,
    }),
  )
  if (!sampled.length) return null

  const ratios = sampled.map((point) => point.ratio)
  const minY = Math.min(...ratios, avg)
  const maxY = Math.max(...ratios, avg)
  const span = maxY - minY
  const pad = span > 0 ? span * 0.08 : 0.05
  const yMin = Math.max(0, minY - pad)
  const yMax = maxY + pad

  const bandAbove = isDark.value ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 197, 94, 0.12)'
  const bandBelow = isDark.value ? 'rgba(244, 63, 94, 0.18)' : 'rgba(251, 113, 133, 0.16)'
  const avgColor = isDark.value ? '#c4b5fd' : '#7c3aed'
  const labelAbove = isDark.value ? '#86efac' : '#15803d'
  const labelBelow = isDark.value ? '#fda4af' : '#be123c'
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }
  const first = sampled[0]!
  const last = sampled[sampled.length - 1]!
  const highlights = sampled.filter(
    (point) => point.fecha === maxFecha || point.fecha === lastFecha,
  )
  const dolarLabel = props.dolarLabel

  return defineChart(
    {
      marks: [
        decorative(
          areaY(sampled, {
            x: 'date',
            y1: yMin,
            y2: avg,
            fill: bandBelow,
            fillOpacity: 1,
          }),
        ),
        decorative(
          areaY(sampled, {
            x: 'date',
            y1: avg,
            y2: yMax,
            fill: bandAbove,
            fillOpacity: 1,
          }),
        ),
        decorative(
          ruleY([avg], {
            stroke: avgColor,
            strokeWidth: 2,
            strokeDasharray: '6 4',
          }),
        ),
        lineY(sampled, {
          x: 'date',
          y: 'ratio',
          stroke: '#1e3a5f',
          strokeWidth: 2,
        }),
        decorative(
          dot(highlights, {
            x: 'date',
            y: 'ratio',
            r: 4,
            fill: '#1e3a5f',
            stroke: '#ffffff',
            strokeWidth: 2,
          }),
        ),
        decorative(
          text(highlights, {
            x: 'date',
            y: 'ratio',
            text: (row) => formatUvaDolarRatio(row.ratio),
            anchor: 'middle',
            dy: (row) => (row.fecha === maxFecha ? -10 : 16),
            fontSize: 11,
            fontWeight: 700,
            fill: textColor.value,
          }),
        ),
        decorative(
          text([{ date: last.date, y: avg }], {
            x: 'date',
            y: 'y',
            text: () => `Promedio histórico: ${formatUvaDolarRatio(avg)}`,
            anchor: 'end',
            dx: -8,
            fontSize: 11,
            fontWeight: 600,
            fill: avgColor,
          }),
        ),
        decorative(
          text([{ date: first.date, y: yMax }], {
            x: 'date',
            y: 'y',
            text: () => 'UVA barata → cancelar',
            anchor: 'start',
            dx: 8,
            dy: 16,
            fontSize: 11,
            fontWeight: 600,
            fill: labelAbove,
          }),
        ),
        decorative(
          text([{ date: first.date, y: yMin }], {
            x: 'date',
            y: 'y',
            text: () => 'UVA cara → endeudarse',
            anchor: 'start',
            dx: 8,
            dy: -8,
            fontSize: 11,
            fontWeight: 600,
            fill: labelBelow,
          }),
        ),
        crosshair({ x: true, y: false }),
      ],
      scales: {
        x: {
          scale: scaleUtc,
          nice: true,
          grid: false,
          axis: {
            ticks: { format: formatAxisDate },
            tickLabels: { thin: true },
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid,
          axis: {
            label: 'UVA por USD',
            ticks: { format: (value: number) => formatUvaDolarRatio(value) },
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
      focus: 'nearest-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        portal,
        content: (points) => {
          const row = points[0]?.datum
          if (!row || !('fecha' in row)) return { rows: [] }
          return {
            title: formatFechaCorta(row.fecha),
            rows: [
              { label: 'UVA por dólar', value: formatUvaDolarRatio(row.ratio) },
              {
                label: 'Cotización',
                value: `UVA: ${formatArs(row.uva)} · ${dolarLabel} venta: ${formatArs(row.dolarVenta)}`,
              },
              { label: 'Promedio histórico', value: formatUvaDolarRatio(avg) },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full" style="height: 27.5rem; min-height: 440px">
    <Chart
      v-if="definition"
      :definition="definition"
      aria-label="Poder de compra de la UVA frente al dólar"
      class="h-full w-full"
      :height="440"
    />
    <div
      v-else
      class="w-full h-full min-h-[440px] flex items-center justify-center text-sm text-neutral-500"
    >
      Sin datos suficientes de UVA y {{ dolarLabel.toLowerCase() }}.
    </div>
  </div>
</template>
