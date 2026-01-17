<script setup lang="ts">
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  if (props.funds.length === 0) return null

  const sortedFunds = [...props.funds].sort((a, b) => b.tna - a.tna).reverse()
  const names = sortedFunds.map((f) => f.displayName || f.fondo)
  const tnaValues = sortedFunds.map((f) => f.tna * 100)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        const fund = sortedFunds[param.dataIndex]
        const patrimonioText = fund.patrimonio
          ? `<br/>Patrimonio: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              notation: 'compact',
            }).format(fund.patrimonio)}`
          : ''
        return `${param.name}<br/>${param.marker} TNA: ${param.value.toFixed(2)}%${patrimonioText}`
      },
    },
    grid: {
      left: '15%',
      right: '5%',
      bottom: '15%',
      top: '10%',
    },
    xAxis: {
      type: 'value',
      name: 'TNA (%)',
      nameLocation: 'middle',
      nameGap: 30,
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
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: textColor.value,
        fontSize: 11,
      },
    },
    series: [
      {
        name: 'TNA',
        type: 'bar',
        data: tnaValues,
        itemStyle: {
          color: (params: any) => {
            const index = params.dataIndex
            return CHART_COLORS[index % CHART_COLORS.length]
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `${params.value.toFixed(2)}%`,
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
