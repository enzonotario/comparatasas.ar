<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import 'vue-data-ui/style.css'
import { useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiChart } from '~/composables/useVueDataUiChart'
import { useVueDataUiSolidTooltip } from '~/composables/useVueDataUiSolidTooltip'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const chart = useVueDataUiChart('VueUiXy')
const { textColor, gridLineColor } = useChartTheme()
const solidTooltip = useVueDataUiSolidTooltip()

const names = computed(() => {
  if (!props.accounts.length) return []
  return [...props.accounts].sort((a, b) => b.tna - a.tna).map((a) => a.fondo)
})

const dataset = computed(() => {
  if (!props.accounts.length) return []
  const sorted = [...props.accounts].sort((a, b) => b.tna - a.tna)
  return [
    {
      name: 'TNA',
      series: sorted.map((a) => a.tna * 100),
      type: 'line' as const,
      useArea: true,
      smooth: false,
      color: '#10b981',
      suffix: '%',
      dataLabels: true,
    },
  ]
})

const chartConfig = computed(() => ({
  responsive: true,
  theme: '',
  useCssAnimation: false,
  chart: {
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    color: textColor.value,
    height: 384,
    userOptions: { show: false },
    grid: {
      stroke: gridLineColor.value,
      showHorizontalLines: true,
      showVerticalLines: false,
      labels: {
        color: textColor.value,
        show: true,
        fontSize: 10,
        axis: { yLabel: 'TNA (%)' },
        yAxis: {
          formatter: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        xAxisLabels: {
          values: names.value,
          rotation: -45,
          fontSize: 9,
        },
      },
    },
    tooltip: {
      ...solidTooltip.value,
      show: true,
      customFormat: (params: { absoluteIndex?: number }) => {
        const i = params.absoluteIndex ?? 0
        const label = names.value[i] ?? ''
        const sorted = [...props.accounts].sort((a, b) => b.tna - a.tna)
        const acc = sorted[i]
        const y = acc ? (acc.tna * 100).toFixed(2) : ''
        return `<div style="font-family:inherit"><b>${label}</b><br/>TNA: ${y}%</div>`
      },
    },
    legend: { show: false, color: textColor.value },
  },
  line: {
    area: { opacity: 0.35, useGradient: true },
    labels: {
      show: true,
      color: textColor.value,
      fontSize: 9,
      rounding: 1,
    },
  },
  table: { show: false },
}))
</script>

<template>
  <div class="w-full min-h-96 [&_svg]:max-w-full [&_svg]:h-auto">
    <ClientOnly>
      <component
        :is="chart"
        v-if="chart && dataset.length > 0"
        :dataset="dataset"
        :config="chartConfig"
      />
      <div
        v-else-if="chart && dataset.length === 0"
        class="py-12 text-center text-sm text-neutral-500"
      >
        Sin datos para el gráfico.
      </div>
      <div v-else class="min-h-96 flex items-center justify-center text-neutral-500">
        Cargando gráfico…
      </div>
    </ClientOnly>
  </div>
</template>
