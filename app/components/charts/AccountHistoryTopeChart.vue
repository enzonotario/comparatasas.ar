<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import { formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (props.history.length === 0) return null

  // Filtrar solo items con tope
  const itemsWithTope = props.history.filter(
    (item) => item.tope !== null && item.tope !== undefined,
  )

  if (itemsWithTope.length === 0) return null

  const dates = itemsWithTope.map((item) => {
    const date = new Date(item.fecha)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`
  })
  const topeValues = itemsWithTope.map((item, index) => ({
    y: item.tope!,
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
        const tnaText = `TNA: ${(item?.tna * 100).toFixed(2)}%`
        return `<b>${category}</b><br/>Tope: ${formatCurrency(this.y)}<br/>${tnaText}`
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
        text: 'Tope (ARS)',
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
            [0, 'rgba(16, 185, 129, 0.3)'],
            [1, 'rgba(16, 185, 129, 0.05)'],
          ],
        },
      },
    },
    series: [
      {
        name: 'Tope',
        data: topeValues,
        type: 'area',
        color: '#10b981',
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
      <div class="text-neutral-500">No hay datos de tope disponibles</div>
    </div>
  </div>
</template>
