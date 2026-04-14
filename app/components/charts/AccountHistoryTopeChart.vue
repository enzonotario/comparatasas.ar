<script setup lang="ts">
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import 'vue-data-ui/style.css'
import type { VueUiXyConfig, VueUiXyDatasetItem } from 'vue-data-ui'
import { formatCurrency, useChartTheme } from '~/composables/useChartConfig'
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

const filtered = computed(() =>
  props.history.filter((item) => item.tope != null && item.tope !== undefined),
)

const xLabels = computed(() => filtered.value.map((item) => formatShortDate(item.fecha)))

const dataset = computed<VueUiXyDatasetItem[]>(() => {
  if (!filtered.value.length) return []
  return [
    {
      name: 'Tope',
      series: filtered.value.map((item) => item.tope!),
      type: 'line' as const,
      useArea: true,
      smooth: true,
      color: '#10b981',
    },
  ]
})

const chartConfig = computed<VueUiXyConfig>(() => ({
  responsive: true,
  theme: '',
  useCssAnimation: false,
  chart: {
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    color: textColor.value,
    height: 384,
    userOptions: { show: false },
    padding: {
      bottom: 0,
    },
    zoom: {
      minimap: {
        show: true,
        selectedColor: '#3b82f6',
        frameColor: gridLineColor.value,
      },
    },
    highlighter: {
      color: textColor.value,
    },
    grid: {
      stroke: gridLineColor.value,
      showHorizontalLines: true,
      showVerticalLines: false,
      labels: {
        color: textColor.value,
        show: true,
        fontSize: 11,
        axis: {
          yLabel: 'Tope (ARS)',
          xLabel: 'Fecha',
        },
        yAxis: {
          formatter: ({ value }) => formatCurrency(Number(value)),
        },
        xAxisLabels: {
          values: xLabels.value,
          color: textColor.value,
          autoRotate: {
            enable: true,
            angle: -45,
          },
        },
      },
    },
    tooltip: {
      ...solidTooltip.value,
      show: true,
      customFormat: (params: { absoluteIndex?: number }) => {
        const i = params.absoluteIndex ?? 0
        const item = filtered.value[i]
        const label = xLabels.value[i] ?? ''
        if (!item || item.tope == null) return ''
        const tna = `TNA: ${(item.tna * 100).toFixed(2)}%`
        return `<div style="font-family:inherit"><b>${label}</b><br/>Tope: ${formatCurrency(item.tope)}<br/>${tna}</div>`
      },
    },
    legend: { show: false, color: textColor.value },
  },
  line: {
    area: { opacity: 35, useGradient: true },
    labels: { show: false },
  },
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
        No hay datos de tope disponibles.
      </div>
      <div v-else class="min-h-96 flex items-center justify-center text-neutral-500">
        Cargando gráfico…
      </div>
    </ClientOnly>
  </div>
</template>
