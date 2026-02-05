<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  // Separar cuentas con tope y sin límite
  const accountsWithTope = props.accounts.filter((a) => a.tope !== null && a.tope !== undefined)
  const accountsWithoutLimit = props.accounts.filter((a) => a.tope === null || a.tope === undefined)

  // Calcular el máximo tope para posicionar las cuentas sin límite
  const maxTope =
    accountsWithTope.length > 0 ? Math.max(...accountsWithTope.map((a) => a.tope!)) : 1000000

  // Valor para cuentas sin límite (1.5x el máximo tope)
  const sinLimiteValue = maxTope * 1.5

  // Ordenar por TNA de mayor a menor
  const sortedAccountsWithTope = [...accountsWithTope].sort((a, b) => b.tna - a.tna)
  const sortedAccountsWithoutLimit = [...accountsWithoutLimit].sort((a, b) => b.tna - a.tna)

  // Preparar datos para Highcharts scatter
  const scatterData = [
    ...sortedAccountsWithTope.map((a, index) => ({
      x: a.tope!,
      y: a.tna * 100,
      name: a.fondo,
      hasLimit: true,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })),
    ...sortedAccountsWithoutLimit.map((a, index) => ({
      x: sinLimiteValue,
      y: a.tna * 100,
      name: a.fondo,
      hasLimit: false,
      color: CHART_COLORS[(sortedAccountsWithTope.length + index) % CHART_COLORS.length],
    })),
  ]

  if (scatterData.length === 0) return null

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
        const topeText = this.point.hasLimit
          ? `Tope: ${formatCurrency(this.point.x)}`
          : 'Tope: Sin Límite'
        return `<b>${this.point.name}</b><br/>${topeText}<br/>TNA: ${this.point.y.toFixed(2)}%`
      },
    },
    xAxis: {
      title: {
        text: 'Tope (ARS)',
        style: {
          color: textColor.value,
        },
      },
      labels: {
        formatter() {
          // Detectar si es el valor de "Sin Límite"
          if (Math.abs(this.value - sinLimiteValue) < sinLimiteValue * 0.1) {
            return 'Sin Límite'
          }
          if (this.value >= 1000000) return `$${(this.value / 1000000).toFixed(1)}M`
          if (this.value >= 1000) return `$${(this.value / 1000).toFixed(0)}k`
          return `$${this.value}`
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
        name: 'Cuentas',
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
    <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
