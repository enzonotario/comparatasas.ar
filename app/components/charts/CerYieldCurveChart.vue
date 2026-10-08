<script setup lang="ts">
import { colorLegend, colorLegendItems, defineChart, dot, lineY, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import { type CerBondRow, diasAlVencimientoCer } from '~/composables/useBonosCer'
import { useChartTheme } from '~/composables/useChartConfig'
import { hideOverlappingYieldLabels } from '~/lib/charts/yield-label-collision'
import { isPositiveYieldRate } from '~/lib/finance/yield-curve'

export type CerYieldMode = 'tir' | 'tem'

interface Props {
  bonds: CerBondRow[]
  /** TIR anual (default) o TEM mensual implícita. */
  mode?: CerYieldMode
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'tir',
})

const { textColor, gridLineColor } = useChartTheme()

const yieldLabel = computed(() => (props.mode === 'tem' ? 'TEM' : 'TIR'))

function yieldPercent(bond: CerBondRow): number {
  if (props.mode === 'tem') return bond.temPorcentaje ?? 0
  return bond.tirPorcentaje
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

interface BondRow {
  x: number
  y: number
  name: string
  series: string
}

const definition = computed(() => {
  const curveBonds = props.bonds.filter((bond) => isPositiveYieldRate(bond.tirPorcentaje))
  if (!curveBonds.length) return null

  const label = yieldLabel.value
  const curveName = 'Curva (aprox.)'
  const seriesName = 'Bonos CER'
  const curveColor =
    textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.18)'

  const bondRows: BondRow[] = curveBonds.map((bond) => ({
    x: diasAlVencimientoCer(bond.fechaVencimiento),
    y: yieldPercent(bond),
    name: bond.ticker,
    series: seriesName,
  }))

  const allPoints: [number, number][] = bondRows
    .map((bond) => [bond.x, bond.y] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const curveRows: CurveRow[] = fitPolyCurve(allPoints, 2, 40).map(([x, y]) => ({
    x,
    y,
    series: curveName,
  }))

  const domain = curveRows.length ? [curveName, seriesName] : [seriesName]
  const range = curveRows.length ? [curveColor, '#d97706'] : ['#d97706']
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
        dot(bondRows, {
          x: 'x',
          y: 'y',
          r: 6,
          color: 'series',
        }),
        decorative(
          text(bondRows, {
            x: 'x',
            y: 'y',
            text: (row) => row.name,
            anchor: 'middle',
            dy: -26,
            fontSize: 11,
            fontWeight: 600,
            fill: textColor.value,
          }),
        ),
        decorative(
          text(bondRows, {
            x: 'x',
            y: 'y',
            text: (row) => `${label} ${row.y.toFixed(2)}%`,
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
          scale: scaleLinear,
          nice: true,
          grid: false,
          axis: { label: 'Días al vencimiento' },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: `${label} (%)`,
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
            title: row.name,
            color: points[0]?.color,
            rows: [
              { label, value: `${row.y.toFixed(2)}%` },
              { label: 'Días', value: String(row.x) },
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
      aria-label="Curva de rendimientos de bonos CER"
      class="h-full w-full"
      :height="384"
      @render="({ svg }) => hideOverlappingYieldLabels(svg)"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-muted text-sm italic">Sin datos para la curva.</div>
    </div>
  </div>
</template>
