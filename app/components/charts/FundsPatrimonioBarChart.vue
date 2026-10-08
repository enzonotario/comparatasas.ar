<script setup lang="ts">
import { barX, defineChart, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import {
  PROVIDER_AXIS_LOGO_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'

interface Props {
  funds: ProcessedFund[]
}

const GROUP_ORDER = [
  { id: 'mm' as const, name: 'Money Market' },
  { id: 'rf' as const, name: 'Renta fija' },
  { id: 'rm' as const, name: 'Renta mixta' },
  { id: 'rv' as const, name: 'Renta variable' },
  { id: 'rt' as const, name: 'Retorno total' },
  { id: 'ot' as const, name: 'Otros' },
]

type RankBar = {
  id: string
  name: string
  group: string
  value: number
  valueLabel: string
  color: string
  tnaLabel: string
  logo?: string
}

function fundCategory(f: ProcessedFund): (typeof GROUP_ORDER)[number]['id'] {
  const t = f.type || ''
  if (t === 'mercadoDinero' || t === 'mercadoDineroUsd') return 'mm'
  if (t === 'rentaFija' || t === 'rentaFijaUsd') return 'rf'
  if (t === 'rentaMixta') return 'rm'
  if (t === 'rentaVariable') return 'rv'
  if (t === 'retornoTotal') return 'rt'
  return 'ot'
}

const props = defineProps<Props>()
const { textColor, gridLineColor, colorMode } = useChartTheme()

const rankModel = computed(() => {
  const withP = props.funds.filter((fund) => (fund.patrimonio ?? 0) > 0)
  const buckets: Record<(typeof GROUP_ORDER)[number]['id'], ProcessedFund[]> = {
    mm: [],
    rf: [],
    rm: [],
    rv: [],
    rt: [],
    ot: [],
  }
  for (const fund of withP) buckets[fundCategory(fund)].push(fund)

  const bars: RankBar[] = []
  const domain: string[] = []
  const tickLabel = new Map<string, string>()
  const headerIds = new Set<string>()
  let colorOffset = 0

  GROUP_ORDER.forEach((group, groupIndex) => {
    const list = [...buckets[group.id]].sort((a, b) => (b.patrimonio || 0) - (a.patrimonio || 0))
    if (!list.length) return

    const headerId = `group:${groupIndex}:${group.name}`
    domain.push(headerId)
    tickLabel.set(headerId, group.name)
    headerIds.add(headerId)

    list.forEach((fund, index) => {
      const name = fund.displayName || fund.fondo
      const id = `bar:${group.id}:${index}:${name}`
      const value = fund.patrimonio || 0
      domain.push(id)
      tickLabel.set(id, name)
      bars.push({
        id,
        name,
        group: group.name,
        value,
        valueLabel: formatCurrency(value),
        color: CHART_COLORS[(colorOffset + index) % CHART_COLORS.length]!,
        tnaLabel: `${(fund.tna * 100).toFixed(2)}%`,
        logo: fund.logo,
      })
    })
    colorOffset += list.length
  })

  const maxValue = bars.reduce((max, bar) => Math.max(max, bar.value), 0)
  const logos = providerLogoMap(bars)
  return { bars, domain, tickLabel, headerIds, maxValue, logos }
})

const { onRender: paintLogos } = useProviderLogos(() => rankModel.value.logos, 'after')

const chartHeight = computed(() => {
  const count = rankModel.value.domain.length
  if (count === 0) return 320
  return Math.max(320, 56 + count * 28)
})

const definition = computed(() => {
  const { bars, domain, tickLabel, headerIds, maxValue, logos } = rankModel.value
  const muted = colorMode.value === 'dark' ? '#a3a3a3' : '#525252'

  return defineChart(
    {
      marks: [
        barX(bars, {
          x: 'value',
          y: 'id',
          key: 'id',
          fill: (bar) => bar.color,
          fillOpacity: 1,
          maxThickness: 22,
          inset: 2,
          radius: 3,
        }),
        decorative(
          text(bars, {
            x: 'value',
            y: 'id',
            text: 'valueLabel',
            key: 'id',
            anchor: 'start',
            dx: 6,
            fontSize: 11,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([0, maxValue > 0 ? maxValue * 1.28 : 1]),
          grid: { stroke: gridLineColor.value },
          axis: {
            label: 'Patrimonio',
            ticks: {
              format: (value) => formatCurrency(Number(value)),
            },
          },
        },
        y: {
          scale: scaleBand<string>().domain(domain).padding(0.2),
          axis: {
            line: false,
            ticks: {
              format: (value) => tickLabel.get(String(value)) ?? String(value),
              size: 0,
            },
            tickLabels: {
              thin: false,
              fontSize: 11,
              fontWeight: ({ value }) => (headerIds.has(String(value)) ? 600 : 400),
              dx: ({ value }) => {
                const label = tickLabel.get(String(value))
                return label && logos.has(label) ? PROVIDER_AXIS_LOGO_DX : 0
              },
            },
          },
        },
      },
      theme: {
        foreground: textColor.value,
        muted,
        grid: gridLineColor.value,
        background: 'transparent',
        palette: CHART_COLORS,
      },
    },
    {
      svgAnimation: false,
      tooltip: {
        use: tooltip,
        content: (points) => {
          const bar = points[0]?.datum
          if (!bar) return { rows: [] }
          return {
            title: bar.name,
            color: bar.color,
            rows: [
              { label: 'Grupo', value: bar.group },
              { label: 'Patrimonio', value: bar.valueLabel },
              { label: 'TNA', value: bar.tnaLabel },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <Chart
      v-if="rankModel.bars.length"
      :definition="definition"
      :height="chartHeight"
      aria-label="Patrimonio de fondos por categoría"
      class="w-full"
      @render="paintLogos"
    />
    <div v-else class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
      Sin datos de patrimonio para el gráfico.
    </div>
  </div>
</template>
