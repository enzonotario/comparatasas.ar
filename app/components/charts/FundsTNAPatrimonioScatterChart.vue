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

  // Ordenar por TNA de mayor a menor
  const sortedFunds = [...fundsWithPatrimonio].sort((a, b) => b.tna - a.tna)

  // Preparar datos para Highcharts scatter
  const scatterData = sortedFunds.map((f, index) => ({
    x: f.patrimonio || 0,
    y: f.tna * 100,
    name: f.displayName || f.fondo,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  return {
    chart: {
      type: 'scatter',
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    tooltip: {
      formatter() {
        return `<b>${this.point.name}</b><br/>Patrimonio: ${formatCurrency(this.point.x)}<br/>TNA: ${this.point.y.toFixed(2)}%`
      },
    },
    xAxis: {
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
      scatter: {
        marker: {
          radius: 8,
          lineWidth: 2,
          lineColor: textColor.value === '#fff' ? '#000' : '#fff',
        },
        dataLabels: {
          enabled: true,
          formatter() {
            const tna = this.y.toFixed(1)
            return `${this.point.name}<br/>${tna}%`
          },
          style: {
            color: textColor.value,
            fontSize: '11px',
            fontWeight: 'normal',
            textOutline: '1px contrast',
          },
          backgroundColor:
            textColor.value === '#fff' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          padding: 6,
          borderRadius: 6,
        },
      },
    },
    series: [
      {
        name: 'Fondos',
        data: scatterData,
        colorByPoint: true,
      },
    ],
    legend: {
      enabled: false,
    },
    navigation: {
      buttonOptions: {
        enabled: false,
      },
    },
    credits: {
      enabled: false,
    },
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <highchart
      v-if="chartOptions"
      :options="chartOptions"
      class="w-full h-full"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
