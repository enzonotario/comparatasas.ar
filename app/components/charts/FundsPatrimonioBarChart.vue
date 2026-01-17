<script setup lang="ts">
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  // Filtrar fondos que tienen patrimonio
  const fundsWithPatrimonio = props.funds.filter(
    (f) => f.patrimonio !== null && f.patrimonio !== undefined && f.patrimonio > 0,
  )

  if (fundsWithPatrimonio.length === 0) return null

  const sortedFunds = [...fundsWithPatrimonio]
    .sort((a, b) => (b.patrimonio || 0) - (a.patrimonio || 0))
    .reverse()
  const names = sortedFunds.map((f) => f.displayName || f.fondo)
  const patrimonioValues = sortedFunds.map((f) => f.patrimonio || 0)

  return {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    tooltip: {
      formatter() {
        const fund = sortedFunds[this.point.index]
        const tnaText = `<br/>TNA: ${(fund.tna * 100).toFixed(2)}%`
        return `<b>${this.category}</b><br/>Patrimonio: ${formatCurrency(this.y)}${tnaText}`
      },
    },
    xAxis: {
      categories: names,
      labels: {
        style: {
          color: textColor.value,
          fontSize: '11px',
        },
      },
    },
    yAxis: {
      title: {
        text: 'Patrimonio (ARS)',
        style: {
          color: textColor.value,
        },
      },
      labels: {
        formatter() {
          return formatCurrency(this.value)
        },
        style: {
          color: textColor.value,
        },
      },
      gridLineColor: gridLineColor.value,
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          formatter() {
            return formatCurrency(this.y)
          },
          style: {
            color: textColor.value,
          },
        },
        colorByPoint: true,
        colors: names.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
      },
    },
    series: [
      {
        name: 'Patrimonio',
        data: patrimonioValues,
      },
    ],
    legend: {
      enabled: false,
    },
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
