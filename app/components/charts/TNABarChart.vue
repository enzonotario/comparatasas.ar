<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOptions = computed(() => {
  if (props.accounts.length === 0) return null

  const sortedAccounts = [...props.accounts].sort((a, b) => b.tna - a.tna).reverse()
  const names = sortedAccounts.map((a) => a.fondo)
  const tnaValues = sortedAccounts.map((a, index) => ({
    y: a.tna * 100,
    name: names[index],
  }))

  return {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
    },
    title: {
      text: '',
    },
    tooltip: {
      formatter() {
        const category = (this.point as any).name || this.x
        return `<b>${category}</b><br/>TNA: ${this.y.toFixed(2)}%`
      },
    },
    xAxis: {
      categories: names,
      labels: {
        style: {
          color: textColor.value,
          fontSize: '11px',
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
      bar: {
        dataLabels: {
          enabled: true,
          formatter() {
            return `${this.y.toFixed(2)}%`
          },
          style: {
            color: textColor.value,
          },
        },
        colorByPoint: true,
        colors: names.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
      },
    },
    series: [
      {
        name: 'TNA',
        data: tnaValues,
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
