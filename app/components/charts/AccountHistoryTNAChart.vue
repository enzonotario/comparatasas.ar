<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (props.history.length === 0) return null

  const dates = props.history.map((item) => {
    const date = new Date(item.fecha)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`
  })
  const tnaValues = props.history.map((item, index) => ({
    y: item.tna * 100,
    name: dates[index],
    customData: item,
  }))

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
        const category = (this.point as any).name || this.x
        const item = (this.point as any).customData
        const topeText = item?.tope
          ? `Tope: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(item.tope)}`
          : 'Tope: Sin Límite'
        return `<b>${category}</b><br/>TNA: ${this.y.toFixed(2)}%<br/>${topeText}`
      },
    },
    xAxis: {
      categories: dates,
      labels: {
        style: {
          color: textColor.value,
        },
        rotation: -45,
      },
      title: {
        text: 'Fecha',
        style: {
          color: textColor.value,
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
      line: {
        marker: {
          enabled: true,
          radius: 3,
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
            [0, 'rgba(59, 130, 246, 0.3)'],
            [1, 'rgba(59, 130, 246, 0.05)'],
          ],
        },
      },
    },
    series: [
      {
        name: 'TNA',
        data: tnaValues,
        type: 'area',
        color: '#3b82f6',
        lineWidth: 2,
      },
    ],
    legend: {
      enabled: false,
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
