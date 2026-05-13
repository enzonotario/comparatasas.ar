<script setup lang="ts">
import type { InvestmentCarryAllocation } from '~/lib/finance/contado-cuotas-carry'
import { CHART_COLORS, formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  allocations: InvestmentCarryAllocation[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (!props.allocations.length) return null

  return {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    accessibility: {
      enabled: false,
    },
    xAxis: {
      categories: props.allocations.map((item) => item.label),
      labels: {
        style: {
          color: textColor.value,
        },
      },
      lineColor: gridLineColor.value,
    },
    yAxis: {
      title: {
        text: 'Monto inicial',
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
    tooltip: {
      useHTML: true,
      formatter() {
        const point = (this as { point: { allocation: InvestmentCarryAllocation } }).point
        const allocation = point.allocation
        return `
          <div style="font-family:inherit">
            <b>${allocation.label}</b><br/>
            Asignado: <b>${formatCurrencyFull(allocation.initialAmount)}</b><br/>
            TNA: <b>${(allocation.tna * 100).toFixed(2)}%</b><br/>
            Tope: <b>${allocation.tope == null ? 'Sin límite' : formatCurrencyFull(allocation.tope)}</b>
          </div>
        `
      },
    },
    plotOptions: {
      series: {
        borderRadius: 6,
        animation: false,
        dataLabels: {
          enabled: true,
          formatter() {
            return formatCurrencyFull(Number((this as { y: number }).y))
          },
          style: {
            color: textColor.value,
            textOutline: 'none',
            fontSize: '10px',
          },
        },
      },
    },
    legend: {
      enabled: false,
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
      {
        name: 'Asignación inicial',
        data: props.allocations.map((allocation, index) => ({
          y: allocation.initialAmount,
          color: allocation.isCashReserve ? '#94a3b8' : CHART_COLORS[index % CHART_COLORS.length],
          allocation,
        })),
      },
    ],
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">
      Sin datos para el gráfico.
    </div>
  </div>
</template>
