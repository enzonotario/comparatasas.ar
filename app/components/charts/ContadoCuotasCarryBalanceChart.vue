<script setup lang="ts">
import type { InvestmentCarryPoint } from '~/lib/finance/contado-cuotas-carry'
import { CHART_COLORS, formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  points: InvestmentCarryPoint[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const areaSeries = computed(() => {
  if (!props.points.length) return []

  const uniqueBuckets = new Map<string, { label: string; isCashReserve?: boolean }>()
  for (const point of props.points) {
    for (const bucket of point.buckets) {
      if (!uniqueBuckets.has(bucket.id)) {
        uniqueBuckets.set(bucket.id, {
          label: bucket.label,
          isCashReserve: bucket.isCashReserve,
        })
      }
    }
  }

  return [...uniqueBuckets.entries()].map(([id, meta], index) => ({
    id,
    name: meta.label,
    type: 'area',
    yAxis: 0,
    stack: 'balances',
    color: meta.isCashReserve ? '#94a3b8' : CHART_COLORS[index % CHART_COLORS.length],
    data: props.points.map(
      (point) => point.buckets.find((bucket) => bucket.id === id)?.balance ?? 0,
    ),
  }))
})

const chartOptions = computed(() => {
  if (!props.points.length) return null

  return {
    chart: {
      backgroundColor: 'transparent',
      zoomType: 'x',
    },
    title: {
      text: '',
    },
    accessibility: {
      enabled: false,
    },
    xAxis: {
      categories: props.points.map((point) => point.label),
      labels: {
        style: {
          color: textColor.value,
        },
      },
      lineColor: gridLineColor.value,
    },
    yAxis: [
      {
        title: {
          text: 'Saldo / deuda remanente',
          style: { color: textColor.value },
        },
        labels: {
          formatter() {
            return formatCurrencyFull(Number((this as { value: number }).value))
          },
          style: { color: textColor.value },
        },
        gridLineColor: gridLineColor.value,
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      formatter() {
        const point = props.points[(this as { x: number }).x ?? 0]
        const header = `<b>${point?.label ?? ''}</b>`
        const body = (
          this as { points?: Array<{ series: { name: string }; y: number; color: string }> }
        ).points
          ?.filter((item) => Number(item.y) !== 0)
          .map(
            (item) =>
              `<span style="color:${item.color}">●</span> ${item.series.name}: <b>${formatCurrencyFull(Number(item.y))}</b>`,
          )
          .join('<br/>')

        const extra = point
          ? `<br/><span>Pago acumulado: <b>${formatCurrencyFull(point.cumulativePaid)}</b></span><br/><span>Resultado neto: <b>${formatCurrencyFull(point.netOutcome)}</b></span>`
          : ''

        return `${header}<br/>${body ?? ''}${extra}`
      },
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        marker: {
          enabled: false,
        },
        fillOpacity: 0.55,
      },
      line: {
        marker: {
          enabled: true,
          radius: 3,
        },
      },
      series: {
        animation: false,
      },
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: textColor.value,
      },
    },
    credits: {
      enabled: false,
    },
    navigation: {
      buttonOptions: {
        enabled: false,
      },
    },
    series: [
      ...areaSeries.value,
      {
        name: 'Deuda remanente',
        type: 'line',
        color: '#f59e0b',
        dashStyle: 'ShortDash',
        data: props.points.map((point) => point.remainingLiability),
      },
      {
        name: 'Resultado neto',
        type: 'line',
        color: '#22c55e',
        lineWidth: 3,
        data: props.points.map((point) => point.netOutcome),
      },
    ],
  }
})
</script>

<template>
  <div class="w-full" style="height: 28rem; min-height: 448px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">
      Sin datos para el gráfico.
    </div>
  </div>
</template>
