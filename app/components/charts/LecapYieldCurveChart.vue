<script setup lang="ts">
import type { Lecap } from '~/types/investments'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  lecaps: Lecap[]
}

const props = defineProps<Props>()
const colorMode = useColorMode()
const { textColor, gridLineColor } = useChartTheme()

const tooltipBackground = computed(() => (colorMode.value === 'dark' ? '#171717' : '#ffffff'))

// Polynomial regression (degree 2)
function fitPolyCurve(points: [number, number][], degree: number, n: number) {
  if (points.length < degree + 1) return []

  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const m = degree + 1

  // Build normal equations (Vandermonde)
  const A: number[][] = []
  const B: number[] = []
  for (let i = 0; i < m; i++) {
    A[i] = []
    for (let j = 0; j < m; j++) {
      A[i]![j] = xs.reduce((s, x) => s + Math.pow(x, i + j), 0)
    }
    B[i] = xs.reduce((s, x, k) => s + ys[k]! * Math.pow(x, i), 0)
  }

  // Gaussian elimination
  for (let i = 0; i < m; i++) {
    let maxRow = i
    for (let k = i + 1; k < m; k++) if (Math.abs(A[k]![i]!) > Math.abs(A[maxRow]![i]!)) maxRow = k
    ;[A[i], A[maxRow]] = [A[maxRow]!, A[i]!]
    ;[B[i], B[maxRow]] = [B[maxRow]!, B[i]!]
    for (let k = i + 1; k < m; k++) {
      const f = A[k]![i]! / A[i]![i]!
      for (let j = i; j < m; j++) A[k]![j] -= f * A[i]![j]!
      B[k] -= f * B[i]!
    }
  }
  const coeffs = new Array(m)
  for (let i = m - 1; i >= 0; i--) {
    coeffs[i] = B[i]
    for (let j = i + 1; j < m; j++) coeffs[i] -= A[i]![j]! * coeffs[j]
    coeffs[i] /= A[i]![i]!
  }

  // Generate curve points
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const result = []
  for (let i = 0; i <= n; i++) {
    const x = minX + (maxX - minX) * (i / n)
    let y = 0
    for (let j = 0; j < m; j++) y += coeffs[j] * Math.pow(x, j)
    result.push([Math.round(x), y])
  }
  return result
}

const chartOptions = computed(() => {
  if (!props.lecaps.length) return null

  const lecapsData = props.lecaps
    .filter((l) => l.type === 'LECAP')
    .map((l) => ({ x: l.days, y: (l.tir || 0) * 100, name: l.symbol }))

  const boncapsData = props.lecaps
    .filter((l) => l.type === 'BONCAP')
    .map((l) => ({ x: l.days, y: (l.tir || 0) * 100, name: l.symbol }))

  const allPoints: [number, number][] = props.lecaps
    .map((l) => [l.days || 0, (l.tir || 0) * 100] as [number, number])
    .sort((a, b) => a[0] - b[0])

  const curveData = fitPolyCurve(allPoints, 2, 50)

  return {
    chart: {
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    accessibility: {
      enabled: false,
    },
    xAxis: {
      title: {
        text: 'Días al vencimiento',
        style: { color: textColor.value },
      },
      labels: { style: { color: textColor.value } },
      gridLineColor: gridLineColor.value,
    },
    yAxis: {
      title: {
        text: 'TIR (%)',
        style: { color: textColor.value },
      },
      labels: {
        formatter(): string {
          return (this as any).value.toFixed(1) + '%'
        },
        style: { color: textColor.value },
      },
      gridLineColor: gridLineColor.value,
    },
    tooltip: {
      shared: false,
      outside: true,
      useHTML: true,
      shape: 'rect',
      backgroundColor: tooltipBackground.value,
      borderColor: gridLineColor.value,
      borderWidth: 1,
      shadow: true,
      padding: 10,
      style: {
        color: textColor.value,
        zIndex: 10050,
      },
      formatter(): string {
        const point = (this as any).point
        if (point.name) {
          return `<b>${point.name}</b><br/>TIR: ${point.y.toFixed(2)}%<br/>Días: ${point.x}`
        }
        return `Curva: ${point.y.toFixed(2)}%`
      },
    },
    plotOptions: {
      scatter: {
        marker: {
          radius: 6,
        },
        dataLabels: {
          enabled: true,
          useHTML: true,
          crop: false,
          overflow: 'allow',
          allowOverlap: false,
          verticalAlign: 'bottom',
          y: -10,
          style: {
            color: textColor.value,
            fontSize: '11px',
            fontWeight: '500',
            textOutline: '1px contrast',
          },
          formatter(): string {
            const point = (this as any).point
            if (!point.name) return `${point.y.toFixed(2)}%`
            return `<span style="display:block;text-align:center;line-height:1.25"><b>${point.name}</b><br/>TIR ${point.y.toFixed(2)}%</span>`
          },
        },
      },
    },
    series: [
      {
        name: 'Curva de Rendimientos',
        type: 'spline',
        data: curveData,
        color: textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)',
        dashStyle: 'Dash',
        marker: { enabled: false },
        enableMouseTracking: false,
      },
      {
        name: 'LECAP',
        type: 'scatter',
        data: lecapsData,
        color: '#059669', // Emerald 600
        marker: { symbol: 'circle' },
      },
      {
        name: 'BONCAP',
        type: 'scatter',
        data: boncapsData,
        color: '#3b82f6', // Blue 500
        marker: { symbol: 'square' },
      },
    ],
    legend: {
      itemStyle: { color: textColor.value },
    },
    credits: { enabled: false },
  }
})
</script>

<template>
  <div class="lecap-yield-curve-chart w-full" style="height: 24rem; min-height: 384px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-muted text-sm italic">
        Cargando curva de rendimientos...
      </div>
    </div>
  </div>
</template>

<style scoped>
/* HTML dataLabels sit above SVG tooltip by default; keep labels under the HTML tooltip */
.lecap-yield-curve-chart :deep(.highcharts-data-labels) {
  z-index: 1;
}
.lecap-yield-curve-chart :deep(.highcharts-label.highcharts-tooltip) {
  z-index: 10050;
}
</style>
