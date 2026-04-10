<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import 'vue-data-ui/style.css'
import { useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiChart } from '~/composables/useVueDataUiChart'
import { useVueDataUiSolidTooltip } from '~/composables/useVueDataUiSolidTooltip'

interface Props {
  history: AccountHistoryItem[]
  providerName: string
}

const props = defineProps<Props>()

const chart = useVueDataUiChart('VueUiXy')
const { textColor, gridLineColor } = useChartTheme()
const solidTooltip = useVueDataUiSolidTooltip()

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`
}

const xLabels = computed(() => props.history.map((item) => formatShortDate(item.fecha)))

const dataset = computed(() => {
  if (!props.history.length) return []
  return [
    {
      name: 'TNA',
      series: props.history.map((item) => item.tna * 100),
      type: 'line' as const,
      useArea: true,
      smooth: true,
      color: '#3b82f6',
      suffix: '%',
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
        fontSize: 11,
        axis: {
          yLabel: 'TNA (%)',
          xLabel: 'Fecha',
        },
        yAxis: {
          formatter: (v: number | string) => `${Number(v).toFixed(1)}%`,
        },
        xAxisLabels: {
          values: xLabels.value,
          rotation: -45,
          fontSize: 10,
        },
      },
    },
    tooltip: {
      ...solidTooltip.value,
      show: true,
      customFormat: (params: { absoluteIndex?: number }) => {
        const i = params.absoluteIndex ?? 0
        const item = props.history[i]
        const label = xLabels.value[i] ?? ''
        if (!item) return ''
        const y = (item.tna * 100).toFixed(2)
        const topeText = item.tope
          ? `Tope: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(item.tope)}`
          : 'Tope: Sin límite'
        return `<div style="font-family:inherit"><b>${label}</b><br/>TNA: ${y}%<br/>${topeText}</div>`
      },
    },
    legend: { show: false, color: textColor.value },
  },
  line: {
    area: { opacity: 0.35, useGradient: true },
    labels: { show: false },
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
        Sin datos de historial.
      </div>
      <div v-else class="min-h-96 flex items-center justify-center text-neutral-500">
        Cargando gráfico…
      </div>
    </ClientOnly>
  </div>
</template>
