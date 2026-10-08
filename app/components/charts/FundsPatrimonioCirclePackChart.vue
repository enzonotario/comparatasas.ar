<script setup lang="ts">
import { defineChart } from '@tanstack/charts'
import { treemap } from '@tanstack/charts/hierarchy/treemap'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import { providerLogoMap, useProviderLogos } from '~/lib/charts/provider-logos'

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

const PATH_DELIMITER = '\u001f'

type PatrimonioLeaf = {
  path: string
  name: string
  group: string
  patrimonio: number
  valueLabel: string
  tnaLabel: string
  color: string
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

const leaves = computed(() => {
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

  const rows: PatrimonioLeaf[] = []
  let colorOffset = 0

  for (const group of GROUP_ORDER) {
    const list = [...buckets[group.id]].sort((a, b) => (b.patrimonio || 0) - (a.patrimonio || 0))
    list.forEach((fund, index) => {
      const name = fund.displayName || fund.fondo
      const patrimonio = fund.patrimonio || 0
      rows.push({
        path: `${group.name}${PATH_DELIMITER}${name}${PATH_DELIMITER}${index}`,
        name,
        group: group.name,
        patrimonio,
        valueLabel: formatCurrency(patrimonio),
        tnaLabel: `${(fund.tna * 100).toFixed(2)}%`,
        color: CHART_COLORS[colorOffset % CHART_COLORS.length]!,
        logo: fund.logo,
      })
      colorOffset += 1
    })
  }

  return rows
})

const logos = computed(() => providerLogoMap(leaves.value))

const { onRender: paintLogos } = useProviderLogos(logos, 'before')

const definition = computed(() => {
  const muted = colorMode.value === 'dark' ? '#a3a3a3' : '#525252'
  const stroke = colorMode.value === 'dark' ? '#18181b' : '#ffffff'

  return defineChart(
    {
      marks: [
        treemap(leaves.value, {
          path: 'path',
          delimiter: PATH_DELIMITER,
          value: 'patrimonio',
          paddingInner: 2,
          paddingOuter: 3,
          round: true,
          inset: 1,
          fill: (node) => node.data?.color ?? CHART_COLORS[0],
          stroke,
          strokeWidth: 1,
          label: (node) => node.data?.name ?? null,
          labelFill: textColor.value,
          labelFontSize: 11,
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
      guides: false,
      margin: 0,
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
          const row = points[0]?.datum.data
          if (!row) return { rows: [] }
          return {
            title: `${row.group} · ${row.name}`,
            color: row.color,
            rows: [
              { label: 'Patrimonio', value: row.valueLabel },
              { label: 'TNA', value: row.tnaLabel },
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
      v-if="leaves.length"
      :definition="definition"
      :height="440"
      aria-label="Mapa de patrimonio de fondos"
      class="w-full"
      @render="paintLogos"
    />
    <div v-else class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
      Sin datos de patrimonio para el gráfico.
    </div>
  </div>
</template>
