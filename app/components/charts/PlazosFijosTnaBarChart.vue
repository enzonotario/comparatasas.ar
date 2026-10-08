<script setup lang="ts">
import { barX, defineChart, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'
import {
  PROVIDER_AXIS_LOGO_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'

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
    .filter((item) => item.tna > 0)
    .sort((a, b) => (props.sortTnaAscending ? a.tna - b.tna : b.tna - a.tna)),
)

const chartRows = computed(() =>
  sortedItems.value.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length]!,
  })),
)

const chartHeight = computed(() => {
  const n = chartRows.value.length
  if (n === 0) return 280
  return Math.max(280, 56 + n * 36)
})

const logos = computed(() =>
  providerLogoMap(chartRows.value.map((item) => ({ name: item.institution, logo: item.logo }))),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'after')

const definition = computed(() => {
  const rows = chartRows.value

  return defineChart(
    {
      marks: [
        barX(rows, {
          x: 'tna',
          y: 'institution',
          key: 'institution',
          fill: (row) => row.color,
          maxThickness: 22,
          radius: { end: 3 },
        }),
        decorative(
          text(rows, {
            x: 'tna',
            y: 'institution',
            text: (row) => `${formatTna(row.tna)}%`,
            key: 'institution',
            anchor: 'start',
            dx: 6,
            fontSize: 11,
            fontWeight: 600,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid: { stroke: gridLineColor.value },
          axis: {
            ticks: {
              format: (value: number) => `${formatTna(value)}%`,
            },
          },
        },
        y: {
          scale: () => scaleBand<string>().padding(0.2),
          grid: false,
          axis: {
            line: false,
            ticks: { size: 0 },
            tickLabels: {
              dx: ({ value }) => (logos.value.has(String(value)) ? PROVIDER_AXIS_LOGO_DX : 0),
            },
          },
        },
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
        palette: CHART_COLORS,
      },
    },
    {
      focus: 'group-y',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const point = points[0]
          if (!point) return { rows: [] }
          const tna = typeof point.xValue === 'number' ? point.xValue : point.datum.tna
          return {
            title: point.datum.institution,
            color: point.datum.color,
            rows: [{ label: 'TNA', value: `${formatTna(tna)}%` }],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full min-w-0">
    <ClientOnly>
      <div
        v-if="chartRows.length > 0"
        class="flex w-full flex-col"
        :style="{ height: `${chartHeight}px` }"
      >
        <p class="mb-1 shrink-0 text-[11px] font-medium leading-none" :style="{ color: textColor }">
          {{ parentGroupName }}
        </p>
        <div class="min-h-0 flex-1">
          <Chart
            :definition="definition"
            :aria-label="parentGroupName"
            class="h-full w-full"
            :style="{ height: '100%' }"
            @render="paintLogos"
          />
        </div>
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
