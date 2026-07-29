<script setup lang="ts">
import type { SeriesLineOptions } from 'highcharts'
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

const tooltipBackground = computed(() => (colorMode.value === 'dark' ? '#171717' : '#ffffff'))

const isDark = computed(() => colorMode.value === 'dark')

function ymdToUtcMs(ymd: string): number {
  const [y = 1970, m = 1, d = 1] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
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

function formatArs(value: number): string {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Un punto cada N días para no saturar Highcharts; siempre incluye max y último. */
function downsamplePoints(
  points: UvaDolarPoderCompraPoint[],
  stepDias: number,
  keepFechas: Set<string>,
): UvaDolarPoderCompraPoint[] {
  if (points.length <= 800 || stepDias <= 1) return points
  const out: UvaDolarPoderCompraPoint[] = []
  let lastKeptMs = -Infinity
  const stepMs = stepDias * 86400000
  for (const p of points) {
    const ms = ymdToUtcMs(p.fecha)
    if (keepFechas.has(p.fecha) || ms - lastKeptMs >= stepMs) {
      out.push(p)
      lastKeptMs = ms
    }
  }
  return out
}

const chartOptions = computed(() => {
  const series = props.series
  if (!series || series.points.length === 0) return null

  const avg = series.promedioHistorico
  const maxFecha = series.maximo?.fecha
  const lastFecha = series.ultimo?.fecha
  const keep = new Set([maxFecha, lastFecha].filter(Boolean) as string[])
  const sampled = downsamplePoints(series.points, 3, keep)

  const ratios = sampled.map((p) => p.ratio)
  const minY = Math.min(...ratios, avg)
  const maxY = Math.max(...ratios, avg)
  const span = maxY - minY
  const pad = span > 0 ? span * 0.08 : 0.05

  const lineData = sampled.map((p) => {
    const base: { x: number; y: number; dataLabels?: object; marker?: object } = {
      x: ymdToUtcMs(p.fecha),
      y: p.ratio,
    }
    if (p.fecha === maxFecha || p.fecha === lastFecha) {
      const label = formatUvaDolarRatio(p.ratio)
      base.dataLabels = {
        enabled: true,
        formatter(): string {
          return label
        },
        style: {
          color: textColor.value,
          fontWeight: '700',
          textOutline: isDark.value ? '1px #171717' : '1px #ffffff',
        },
        verticalAlign: p.fecha === maxFecha ? 'bottom' : 'top',
        y: p.fecha === maxFecha ? -8 : 16,
      }
      base.marker = {
        enabled: true,
        radius: 4,
        fillColor: '#1e3a5f',
        lineWidth: 2,
        lineColor: '#ffffff',
      }
    }
    return base
  })

  const lineSeries: SeriesLineOptions = {
    type: 'line',
    name: 'UVA por dólar',
    data: lineData,
    color: '#1e3a5f',
    lineWidth: 2,
    marker: { enabled: false },
  }

  const bandAbove = isDark.value ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 197, 94, 0.12)'
  const bandBelow = isDark.value ? 'rgba(244, 63, 94, 0.18)' : 'rgba(251, 113, 133, 0.16)'
  const avgColor = isDark.value ? '#c4b5fd' : '#7c3aed'

  return {
    chart: {
      backgroundColor: 'transparent',
      height: 440,
      spacing: [16, 12, 16, 12],
      zoomType: 'x',
    },
    title: { text: '' },
    accessibility: { enabled: false },
    time: { useUTC: true },
    xAxis: {
      type: 'datetime',
      title: { text: undefined },
      labels: { style: { color: textColor.value } },
      gridLineWidth: 0,
      lineColor: gridLineColor.value,
      tickColor: gridLineColor.value,
      crosshair: true,
    },
    yAxis: {
      title: {
        text: 'UVA por USD',
        style: { color: textColor.value },
      },
      min: Math.max(0, minY - pad),
      max: maxY + pad,
      labels: {
        style: { color: textColor.value },
        formatter(): string {
          return formatUvaDolarRatio(Number((this as unknown as { value: number }).value))
        },
      },
      gridLineColor: gridLineColor.value,
      plotLines: [
        {
          value: avg,
          color: avgColor,
          width: 2,
          dashStyle: 'Dash',
          zIndex: 5,
          label: {
            text: `Promedio histórico: ${formatUvaDolarRatio(avg)}`,
            align: 'right',
            x: -8,
            style: {
              color: avgColor,
              fontWeight: '600',
              fontSize: '11px',
            },
          },
        },
      ],
      plotBands: [
        {
          from: avg,
          to: maxY + pad + 1,
          color: bandAbove,
          label: {
            text: 'UVA barata → cancelar',
            align: 'left',
            x: 8,
            verticalAlign: 'top',
            y: 18,
            style: {
              color: isDark.value ? '#86efac' : '#15803d',
              fontSize: '11px',
              fontWeight: '600',
            },
          },
        },
        {
          from: 0,
          to: avg,
          color: bandBelow,
          label: {
            text: 'UVA cara → endeudarse',
            align: 'left',
            x: 8,
            verticalAlign: 'bottom',
            y: -12,
            style: {
              color: isDark.value ? '#fda4af' : '#be123c',
              fontSize: '11px',
              fontWeight: '600',
            },
          },
        },
      ],
    },
    tooltip: {
      shared: false,
      outside: true,
      useHTML: true,
      backgroundColor: tooltipBackground.value,
      borderColor: gridLineColor.value,
      borderWidth: 1,
      padding: 12,
      style: {
        color: textColor.value,
        zIndex: 10050,
      },
      formatter(): string {
        const ctx = this as unknown as { x: number; y: number }
        const fecha = new Date(ctx.x).toISOString().slice(0, 10)
        const point = series.points.find((p) => p.fecha === fecha)
        const fechaStr = formatFechaCorta(fecha)
        let html = `<div style="font-family:inherit"><b>${fechaStr}</b><br/>`
        html += `UVA por dólar: <b>${formatUvaDolarRatio(ctx.y)}</b><br/>`
        if (point) {
          html += `<span style="opacity:.85">UVA: ${formatArs(point.uva)} · ${props.dolarLabel} venta: ${formatArs(point.dolarVenta)}</span><br/>`
        }
        html += `<span style="opacity:.85">Promedio histórico: ${formatUvaDolarRatio(avg)}</span>`
        html += '</div>'
        return html
      },
    },
    plotOptions: {
      line: {
        animation: { duration: 400 },
        turboThreshold: 0,
      },
      series: {
        states: {
          hover: { lineWidthPlus: 0 },
        },
      },
    },
    series: [lineSeries],
    legend: { enabled: false },
    credits: { enabled: false },
    navigation: {
      buttonOptions: { enabled: false },
    },
  }
})
</script>

<template>
  <div class="uva-dolar-poder-compra-chart w-full" style="height: 27.5rem; min-height: 440px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div
      v-else
      class="w-full h-full min-h-[440px] flex items-center justify-center text-sm text-neutral-500"
    >
      Sin datos suficientes de UVA y {{ dolarLabel.toLowerCase() }}.
    </div>
  </div>
</template>

<style scoped>
.uva-dolar-poder-compra-chart :deep(.highcharts-tooltip) {
  z-index: 10050;
}
</style>
