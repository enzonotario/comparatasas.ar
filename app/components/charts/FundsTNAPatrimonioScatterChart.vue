<script setup lang="ts">
import { defineChart, dot, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import {
  PROVIDER_LOGO_PAIR_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'
import { hideOverlappingYieldLabels } from '~/lib/charts/yield-label-collision'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const logos = computed(() =>
  providerLogoMap(
    props.funds.map((fund) => ({
      name: fund.displayName || fund.fondo,
      logo: fund.logo,
    })),
  ),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'before')

function onRender(context: { svg: SVGSVGElement }) {
  paintLogos(context)
  hideOverlappingYieldLabels(context.svg)
}

interface ScatterRow {
  id: string
  x: number
  y: number
  name: string
  color: string
}

const definition = computed(() => {
  const fundsWithPatrimonio = props.funds.filter(
    (fund) => fund.patrimonio !== null && fund.patrimonio !== undefined && fund.patrimonio > 0,
  )
  if (fundsWithPatrimonio.length === 0) return null

  const sortedFunds = [...fundsWithPatrimonio].sort((a, b) => b.tna - a.tna)
  const rows: ScatterRow[] = sortedFunds.map((fund, index) => ({
    id: `${fund.displayName || fund.fondo}-${index}`,
    x: fund.patrimonio || 0,
    y: fund.tna * 100,
    name: fund.displayName || fund.fondo,
    color: CHART_COLORS[index % CHART_COLORS.length]!,
  }))

  const outline = textColor.value === '#fff' ? '#000' : '#fff'
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }
  const labelDx = (row: ScatterRow) => (logos.value.has(row.name) ? PROVIDER_LOGO_PAIR_DX : 0)

  return defineChart(
    {
      marks: [
        dot(rows, {
          x: 'x',
          y: 'y',
          r: 8,
          color: 'id',
          stroke: outline,
          strokeWidth: 2,
        }),
        decorative(
          text(rows, {
            x: 'x',
            y: 'y',
            text: (row) => row.name,
            anchor: 'middle',
            dx: labelDx,
            dy: -28,
            fontSize: 11,
            fontWeight: 600,
            fill: textColor.value,
          }),
        ),
        decorative(
          text(rows, {
            x: 'x',
            y: 'y',
            text: (row) => `${row.y.toFixed(1)}%`,
            anchor: 'middle',
            dx: labelDx,
            dy: -14,
            fontSize: 11,
            fontWeight: 500,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear,
          nice: true,
          grid: false,
          axis: {
            label: 'Patrimonio (ARS)',
            ticks: { format: (value: number) => formatCurrency(value) },
          },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: 'TNA (%)',
            ticks: { format: (value: number) => `${value.toFixed(1)}%` },
          },
        },
      },
      margin: { top: 40 },
      color: {
        domain: rows.map((row) => row.id),
        range: rows.map((row) => row.color),
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
    },
    {
      tooltip: {
        use: tooltip,
        content: (points) => {
          const row = points[0]?.datum
          if (!row) return { rows: [] }
          return {
            title: row.name,
            rows: [
              { label: 'Patrimonio', value: formatCurrency(row.x) },
              { label: 'TNA', value: `${row.y.toFixed(2)}%` },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <Chart
      v-if="definition"
      :definition="definition"
      aria-label="Dispersión de TNA y patrimonio de fondos"
      class="h-full w-full"
      :height="384"
      @render="onRender"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
