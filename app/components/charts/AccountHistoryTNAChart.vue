<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  if (props.history.length === 0) return null

  const dates = props.history.map((item) => item.fecha)
  const tnaValues = props.history.map((item) => item.tna * 100)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        const index = param.dataIndex
        const item = props.history[index]
        const topeText = item.tope ? `Tope: ${new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(item.tope)}` : 'Tope: Sin Límite'
        return `${param.name}<br/>${param.marker} TNA: ${param.value.toFixed(2)}%<br/>${topeText}`
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
      name: 'TNA (%)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: (value: number) => `${value.toFixed(1)}%`,
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
        name: 'TNA',
        type: 'line',
        data: tnaValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#3b82f6',
        },
        itemStyle: {
          color: '#3b82f6',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
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
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
