<script setup lang="ts">
import type { CaucionRow } from '~/composables/useCauciones'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  items: CaucionRow[]
  moneda: 'ars' | 'usd'
}

const props = defineProps<Props>()

const colorMode = useColorMode()
const { textColor, gridLineColor } = useChartTheme()

const tooltipBackground = computed(() => (colorMode.value === 'dark' ? '#171717' : '#ffffff'))

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
      B[k] -= f * B[i]!
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

const chartOptions = computed(() => {
  if (!props.items.length) return null

  const maxMonto = Math.max(...props.items.map((item) => item.montoContado), 1)

  const scatterData = props.items.map((item) => {
    const ratio = Math.sqrt(item.montoContado / maxMonto)
    return {
      x: item.plazo,
      y: item.tasaActual,
      name: `${item.plazo}d`,
      monto: item.montoContado,
      min: item.tasaMinDia,
      max: item.tasaMaxDia,
      op: item.fechaOperacionDate,
      vto: item.fechaVencimientoDate,
      marker: {
        radius: 4 + ratio * 10,
      },
    }
  })

  const allPoints: [number, number][] = props.items
    .map((item) => [item.plazo, item.tasaActual] as [number, number])
    .sort((a, b) => a[0] - b[0])

  const curveData = fitPolyCurve(allPoints, Math.min(2, Math.max(1, allPoints.length - 1)), 40)

  return {
    chart: { backgroundColor: 'transparent' },
    title: { text: '' },
    accessibility: { enabled: false },
    xAxis: {
      title: { text: 'Plazo (días)', style: { color: textColor.value } },
      labels: { style: { color: textColor.value } },
      gridLineColor: gridLineColor.value,
      min: 0,
    },
    yAxis: {
      title: { text: 'Tasa actual (%)', style: { color: textColor.value } },
      labels: {
        formatter(): string {
          return `${(this as any).value.toFixed(1)}%`
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
      style: { color: textColor.value, zIndex: 10050 },
      formatter(): string {
        const point = (this as any).point
        if (point.monto != null) {
          return `<b>Plazo ${point.x} días</b><br/>Tasa actual: ${point.y.toFixed(2)}%<br/>Tasa min. día: ${point.min.toFixed(2)}%<br/>Tasa max. día: ${point.max.toFixed(2)}%<br/>Monto: ${formatMonto(point.monto)}<br/>Op.: ${point.op}<br/>Vto: ${point.vto}`
        }
        return `Curva: ${point.y.toFixed(2)}%`
      },
    },
    plotOptions: {
      scatter: {
        marker: {
          fillOpacity: 0.7,
          lineWidth: 1,
          lineColor: seriesColor.value,
        },
      },
    },
    series: [
      {
        name: 'Curva (aprox.)',
        type: 'spline',
        data: curveData,
        color: textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.18)',
        dashStyle: 'Dash',
        marker: { enabled: false },
        enableMouseTracking: false,
        zIndex: 1,
      },
      {
        name: props.moneda === 'usd' ? 'Cauciones USD' : 'Cauciones ARS',
        type: 'scatter',
        data: scatterData,
        color: seriesColor.value,
        zIndex: 2,
      },
    ],
    legend: { itemStyle: { color: textColor.value } },
    credits: { enabled: false },
  }
})
</script>

<template>
  <div class="caucion-yield-curve-chart w-full" style="height: 24rem; min-height: 384px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-muted text-sm italic">Sin datos para la curva.</div>
    </div>
  </div>
</template>

<style scoped>
.caucion-yield-curve-chart :deep(.highcharts-label.highcharts-tooltip) {
  z-index: 10050;
}
</style>
