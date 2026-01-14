<script setup lang="ts">
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  // Filtrar fondos que tienen patrimonio
  const fundsWithPatrimonio = props.funds.filter(
    (f) => f.patrimonio !== null && f.patrimonio !== undefined && f.patrimonio > 0,
  )

  if (fundsWithPatrimonio.length === 0) return null

  const sortedFunds = [...fundsWithPatrimonio].sort((a, b) => (b.patrimonio || 0) - (a.patrimonio || 0)).reverse()
  const names = sortedFunds.map((f) => f.displayName || f.fondo)
  const patrimonioValues = sortedFunds.map((f) => f.patrimonio || 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0]
        const fund = sortedFunds[param.dataIndex]
        const tnaText = `<br/>TNA: ${(fund.tna * 100).toFixed(2)}%`
        return `${param.name}<br/>${param.marker} Patrimonio: ${formatCurrency(param.value)}${tnaText}`
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
      name: 'Patrimonio (ARS)',
      nameLocation: 'middle',
      nameGap: 30,
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
        name: 'Patrimonio',
        type: 'bar',
        data: patrimonioValues,
        itemStyle: {
          color: (params: any) => {
            const index = params.dataIndex
            return CHART_COLORS[index % CHART_COLORS.length]
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => formatCurrency(params.value),
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
