<script setup lang="ts">
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (props.funds.length === 0) return null

  const sortedFunds = [...props.funds].sort((a, b) => b.tna - a.tna).reverse()
  const names = sortedFunds.map((f) => f.displayName || f.fondo)
  const tnaValues = sortedFunds.map((f, index) => ({
    y: f.tna * 100,
    name: names[index],
    customData: f,
  }))

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
        const category = (this.point as any).name || this.x
        const fund = (this.point as any).customData
        const patrimonioText = fund?.patrimonio
          ? `<br/>Patrimonio: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              notation: 'compact',
            }).format(fund.patrimonio)}`
          : ''
        return `<b>${category}</b><br/>TNA: ${this.y.toFixed(2)}%${patrimonioText}`
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
        text: 'TNA (%)',
        style: {
          color: textColor.value,
        },
      },
      labels: {
        formatter() {
          return `${this.value.toFixed(1)}%`
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
            return `${this.y.toFixed(2)}%`
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
        name: 'TNA',
        data: tnaValues,
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
