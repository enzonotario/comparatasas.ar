<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import { useChartTheme } from '~/composables/useChartConfig'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  if (props.accounts.length === 0) return null

  const sortedAccounts = [...props.accounts].sort((a, b) => b.tna - a.tna)
  const names = sortedAccounts.map((a) => a.fondo)
  const tnaValues = sortedAccounts.map((a) => a.tna * 100)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>${param.marker} TNA: ${param.value.toFixed(2)}%`
      },
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '20%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: textColor.value,
        rotate: 45,
        fontSize: 10,
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
              {
                offset: 0,
                color: 'rgba(16, 185, 129, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(16, 185, 129, 0.05)',
              },
            ],
          },
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => `${params.value.toFixed(1)}%`,
          fontSize: 9,
          color: textColor.value,
        },
      },
    ],
    backgroundColor: 'transparent',
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <VChart v-if="chartOption" :option="chartOption" class="w-full h-full" autoresize />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
