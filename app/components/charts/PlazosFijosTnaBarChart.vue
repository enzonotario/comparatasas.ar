<script setup lang="ts">
import { provide } from 'vue'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  TooltipComponentOption,
  TitleComponentOption,
} from 'echarts/components'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

export interface PlazoFijoTnaChartItem {
  institution: string
  tna: number
  logo?: string
  typeLabel?: string
}

interface Props {
  items: PlazoFijoTnaChartItem[]
  /** Etiqueta del grupo raíz (serie) en el gráfico horizontal. */
  parentGroupName?: string
  /** Si es true, ordena por TNA de menor a mayor (por defecto: mayor a menor). */
  sortTnaAscending?: boolean
  /** Si es true, muestra la TNA sin redondear en la etiqueta de barra. */
  preserveTnaPrecision?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  parentGroupName: 'Plazo fijo 30 días · TNA clientes',
  sortTnaAscending: false,
  preserveTnaPrecision: false,
})

type BarOption = ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption | TitleComponentOption
>

const colorMode = computed(() => useColorMode().value)
provide(THEME_KEY, colorMode)

const initOptions = computed(() => ({
  renderer: 'svg' as const,
}))
provide(INIT_OPTIONS_KEY, initOptions)

const { textColor, gridLineColor } = useChartTheme()

function formatTnaPreservingPrecision(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toFixed(6).replace(/\.?0+$/, '')
}

function formatTna(value: number): string {
  if (props.preserveTnaPrecision) return formatTnaPreservingPrecision(value)
  return value.toFixed(2)
}

const sortedItems = computed(() =>
  [...props.items]
    .filter((i) => i.tna > 0)
    .sort((a, b) => (props.sortTnaAscending ? a.tna - b.tna : b.tna - a.tna)),
)

/** ECharts category axis: primer ítem abajo → invertimos para que el mejor TNA quede arriba. */
const chartRows = computed(() => [...sortedItems.value].reverse())

const chartHeight = computed(() => {
  const n = chartRows.value.length
  if (n === 0) return 280
  return Math.max(280, 56 + n * 36)
})

const option = computed<BarOption>(() => {
  const rows = chartRows.value
  const colorByInstitution = new Map(
    sortedItems.value.map((item, index) => [
      item.institution,
      CHART_COLORS[index % CHART_COLORS.length],
    ]),
  )
  const rich: Record<string, Record<string, unknown>> = {
    name: {
      color: textColor.value,
      fontSize: 11,
      padding: [0, 0, 0, 6],
    },
  }

  rows.forEach((row, index) => {
    if (!row.logo) return
    rich[`logo${index}`] = {
      height: 18,
      width: 18,
      borderRadius: 3,
      backgroundColor: { image: row.logo },
    }
  })

  return {
    animationDuration: 400,
    title: {
      text: props.parentGroupName,
      left: 0,
      top: 0,
      textStyle: {
        color: textColor.value,
        fontSize: 11,
        fontWeight: 500,
      },
    },
    grid: {
      top: 28,
      right: 72,
      bottom: 8,
      left: 8,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items[0] as { name?: string; value?: number | string }
        const name = first?.name ?? ''
        const value = Number(first?.value)
        const tna = Number.isFinite(value) ? `${formatTna(value)}%` : '—'
        return `<div style="font-family:inherit"><b>${name}</b><br/>TNA: ${tna}</div>`
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: textColor.value,
        formatter: (value: number) => `${formatTna(value)}%`,
      },
      splitLine: { lineStyle: { color: gridLineColor.value } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.institution),
      axisLabel: {
        color: textColor.value,
        formatter: (value: string, index: number) => {
          const row = rows[index]
          if (row?.logo) return `{logo${index}|}{name|${value}}`
          return `{name|${value}}`
        },
        rich,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        name: props.parentGroupName,
        data: rows.map((row) => ({
          value: row.tna,
          itemStyle: {
            color: colorByInstitution.get(row.institution) ?? CHART_COLORS[0],
            borderRadius: [0, 3, 3, 0],
          },
        })),
        barMaxWidth: 22,
        label: {
          show: true,
          position: 'right',
          color: textColor.value,
          fontWeight: 600,
          fontSize: 11,
          formatter: (params) => `${formatTna(Number(params.value))}%`,
        },
      },
    ],
  }
})
</script>

<template>
  <div class="w-full min-w-0">
    <ClientOnly>
      <div v-if="chartRows.length > 0" class="w-full" :style="{ height: `${chartHeight}px` }">
        <VChart :option="option" class="h-full w-full" autoresize />
      </div>
      <div v-else class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        No hay datos para graficar.
      </div>
      <template #fallback>
        <div class="w-full min-h-96 flex items-center justify-center">
          <div class="text-neutral-500">Cargando gráfico...</div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
