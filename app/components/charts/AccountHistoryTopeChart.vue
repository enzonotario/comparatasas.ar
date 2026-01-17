<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import { formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  if (props.history.length === 0) return null

  // Filtrar solo items con tope
  const itemsWithTope = props.history.filter((item) => item.tope !== null && item.tope !== undefined)

  if (itemsWithTope.length === 0) return null

  const dates = itemsWithTope.map((item) => item.fecha)
  const topeValues = itemsWithTope.map((item) => item.tope!)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        const index = param.dataIndex
        const item = itemsWithTope[index]
        const tnaText = `TNA: ${(item.tna * 100).toFixed(2)}%`
        return `${param.name}<br/>${param.marker} Tope: ${formatCurrency(param.value)}<br/>${tnaText}`
      },
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '15%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`
        },
        color: textColor.value,
        rotate: 45,
      },
      name: 'Fecha',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: textColor.value,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Tope (ARS)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: (value: number) => formatCurrency(value),
        color: textColor.value,
      },
      nameTextStyle: {
        color: textColor.value,
      },
      splitLine: {
        lineStyle: {
          color: gridLineColor.value,
        },
      },
    },
    series: [
      {
        name: 'Tope',
        type: 'line',
        data: topeValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#10b981',
        },
        itemStyle: {
          color: '#10b981',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
    backgroundColor: 'transparent',
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <VChart
      v-if="chartOption"
      :option="chartOption"
      class="w-full h-full"
      autoresize
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">No hay datos de tope disponibles</div>
    </div>
  </div>
</template>
