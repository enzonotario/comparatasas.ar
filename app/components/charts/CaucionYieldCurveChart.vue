<script setup lang="ts">
import { colorLegend, colorLegendItems, defineChart, dot, lineY, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import type { CaucionRow } from '~/composables/useCauciones'
import { useChartTheme } from '~/composables/useChartConfig'
import { hideOverlappingYieldLabels } from '~/lib/charts/yield-label-collision'
import { isPositiveYieldRate } from '~/lib/finance/yield-curve'

interface Props {
  items: CaucionRow[]
  moneda: 'ars' | 'usd'
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const seriesColor = computed(() => (props.moneda === 'usd' ? '#2563eb' : '#059669'))

function formatMonto(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function fitPolyCurve(points: [number, number][], degree: number, n: number) {
  if (points.length < degree + 1) return []

  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const m = degree + 1

  const A: number[][] = []
  const B: number[] = []
  for (let i = 0; i < m; i++) {
    A[i] = []
    for (let j = 0; j < m; j++) {
      A[i]![j] = xs.reduce((s, x) => s + Math.pow(x, i + j), 0)
    }
    B[i] = xs.reduce((s, x, k) => s + ys[k]! * Math.pow(x, i), 0)
  }

  for (let i = 0; i < m; i++) {
    let maxRow = i
    for (let k = i + 1; k < m; k++) if (Math.abs(A[k]![i]!) > Math.abs(A[maxRow]![i]!)) maxRow = k
    ;[A[i], A[maxRow]] = [A[maxRow]!, A[i]!]
    ;[B[i], B[maxRow]] = [B[maxRow]!, B[i]!]
    for (let k = i + 1; k < m; k++) {
      const f = A[k]![i]! / A[i]![i]!
      for (let j = i; j < m; j++) A[k]![j]! -= f * A[i]![j]!
      B[k]! -= f * B[i]!
    }
  }
  const coeffs = new Array(m)
  for (let i = m - 1; i >= 0; i--) {
    coeffs[i] = B[i]
    for (let j = i + 1; j < m; j++) coeffs[i]! -= A[i]![j]! * coeffs[j]
    coeffs[i]! /= A[i]![i]!
  }

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const result: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const x = minX + (maxX - minX) * (i / n)
    let y = 0
    for (let j = 0; j < m; j++) y += coeffs[j]! * Math.pow(x, j)
    result.push([Math.round(x), y])
  }
  return result
}

interface CurveRow {
  x: number
  y: number
  series: string
}

interface ScatterRow {
  x: number
  y: number
  series: string
  radius: number
  monto: number
  min: number
  max: number
  op: string
  vto: string
}

const definition = computed(() => {
  const curveItems = props.items.filter((item) => isPositiveYieldRate(item.tasaActual))
  if (!curveItems.length) return null

  const maxMonto = Math.max(...curveItems.map((item) => item.montoContado), 1)
  const seriesName = props.moneda === 'usd' ? 'Cauciones USD' : 'Cauciones ARS'
  const curveName = 'Curva (aprox.)'
  const curveColor =
    textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.18)'
  const maxPlazo = Math.max(...curveItems.map((item) => item.plazo), 1)

  const scatterRows: ScatterRow[] = curveItems.map((item) => {
    const ratio = Math.sqrt(item.montoContado / maxMonto)
    return {
      x: item.plazo,
      y: item.tasaActual,
      series: seriesName,
      radius: 4 + ratio * 10,
      monto: item.montoContado,
      min: item.tasaMinDia,
      max: item.tasaMaxDia,
      op: item.fechaOperacionDate,
      vto: item.fechaVencimientoDate,
    }
  })

  const allPoints: [number, number][] = curveItems
    .map((item) => [item.plazo, item.tasaActual] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const curveRows: CurveRow[] = fitPolyCurve(
    allPoints,
    Math.min(2, Math.max(1, allPoints.length - 1)),
    40,
  ).map(([x, y]) => ({ x, y, series: curveName }))

  const domain = curveRows.length ? [curveName, seriesName] : [seriesName]
  const range = curveRows.length ? [curveColor, seriesColor.value] : [seriesColor.value]
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }

  return defineChart(
    {
      marks: [
        decorative(
          lineY(curveRows, {
            x: 'x',
            y: 'y',
            color: 'series',
            strokeDasharray: '6 4',
            strokeWidth: 2,
          }),
        ),
        dot(scatterRows, {
          x: 'x',
          y: 'y',
          r: (row) => row.radius,
          color: 'series',
          fillOpacity: 0.7,
          stroke: seriesColor.value,
          strokeWidth: 1,
        }),
        decorative(
          text(scatterRows, {
            x: 'x',
            y: 'y',
            text: (row) => (row.x === 1 ? '1 día' : `${row.x} días`),
            anchor: 'middle',
            dy: -26,
            fontSize: 11,
            fontWeight: 600,
            fill: textColor.value,
          }),
        ),
        decorative(
          text(scatterRows, {
            x: 'x',
            y: 'y',
            text: (row) => `${row.y.toFixed(2)}%`,
            anchor: 'middle',
            dy: -14,
            fontSize: 11,
            fontWeight: 500,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([0, maxPlazo]),
          nice: true,
          grid: false,
          axis: { label: 'Plazo (días)' },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: 'Tasa actual (%)',
            ticks: { format: (value: number) => `${value.toFixed(1)}%` },
          },
        },
      },
      margin: { top: 36 },
      color: {
        domain,
        range,
        legend: colorLegend({
          items: colorLegendItems({
            indicator: {
              shape: (value) => (value === curveName ? 'line' : 'dot'),
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
      tooltip: {
        use: tooltip,
        portal,
        content: (points) => {
          const row = points[0]?.datum
          if (!row) return { rows: [] }
          return {
            title: `Plazo ${row.x} días`,
            color: points[0]?.color,
            rows: [
              { label: 'Tasa actual', value: `${row.y.toFixed(2)}%` },
              { label: 'Tasa min. día', value: `${row.min.toFixed(2)}%` },
              { label: 'Tasa max. día', value: `${row.max.toFixed(2)}%` },
              { label: 'Monto', value: formatMonto(row.monto) },
              { label: 'Op.', value: row.op },
              { label: 'Vto', value: row.vto },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <Chart
      v-if="definition"
      :definition="definition"
      aria-label="Curva de tasas de cauciones"
      class="h-full w-full"
      :height="384"
      @render="({ svg }) => hideOverlappingYieldLabels(svg)"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-muted text-sm italic">Sin datos para la curva.</div>
    </div>
  </div>
</template>
