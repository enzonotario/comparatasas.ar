<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (props.accounts.length === 0) return null

  const sortedAccounts = [...props.accounts].sort((a, b) => b.tna - a.tna)
  const names = sortedAccounts.map((a) => a.fondo)
  const tnaValues = sortedAccounts.map((a) => a.tna * 100)

  return {
    chart: {
      type: 'line',
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    tooltip: {
      formatter() {
        return `<b>${this.category}</b><br/>TNA: ${this.y.toFixed(2)}%`
      },
    },
    xAxis: {
      categories: names,
      labels: {
        style: {
          color: textColor.value,
          fontSize: '10px',
        },
        rotation: -45,
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
      line: {
        dataLabels: {
          enabled: true,
          formatter() {
            return `${this.y.toFixed(1)}%`
          },
          style: {
            color: textColor.value,
            fontSize: '9px',
          },
        },
        marker: {
          enabled: true,
          radius: 4,
        },
      },
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, 'rgba(16, 185, 129, 0.3)'],
            [1, 'rgba(16, 185, 129, 0.05)'],
          ],
        },
      },
    },
    series: [
      {
        name: 'TNA',
        data: tnaValues,
        type: 'area',
        color: '#10b981',
        lineWidth: 2,
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
