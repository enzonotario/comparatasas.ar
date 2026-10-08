<script setup lang="ts">
import { defineChart, lineY, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import type { AccountItem } from '~/composables/useAccounts'
import { useChartTheme } from '~/composables/useChartConfig'
import { providerLogoMap, useProviderLogos } from '~/lib/charts/provider-logos'

interface Props {
  accounts: AccountItem[]
}

type TnaPoint = {
  id: string
  name: string
  tna: number
  label: string
}

const props = defineProps<Props>()
const { textColor, gridLineColor, colorMode } = useChartTheme()

const logos = computed(() =>
  providerLogoMap(props.accounts.map((account) => ({ name: account.fondo, logo: account.logo }))),
)

const { onRender: paintLogos } = useProviderLogos(logos, 'before')

const points = computed(() => {
  return [...props.accounts]
    .sort((a, b) => b.tna - a.tna)
    .map((account, index) => {
      const tna = account.tna * 100
      return {
        id: `${index}:${account.fondo}`,
        name: account.fondo,
        tna,
        label: `${tna.toFixed(1)}%`,
      } satisfies TnaPoint
    })
})

const definition = computed(() => {
  const rows = points.value
  const nameById = new Map(rows.map((row) => [row.id, row.name]))
  const maxTna = rows.reduce((max, row) => Math.max(max, row.tna), 0)
  const muted = colorMode.value === 'dark' ? '#a3a3a3' : '#525252'

  return defineChart(
    {
      marks: [
        lineY(rows, {
          x: 'id',
          y: 'tna',
          key: 'id',
          stroke: '#10b981',
          strokeWidth: 2,
          points: true,
        }),
        decorative(
          text(rows, {
            x: 'id',
            y: 'tna',
            text: 'label',
            key: 'id',
            anchor: 'middle',
            dy: -10,
            fontSize: 9,
            fill: textColor.value,
          }),
        ),
      ],
      scales: {
        x: {
          scale: () => scalePoint<string>().padding(0.5),
          axis: {
            tickLabels: {
              thin: false,
              rotate: -45,
              fontSize: 9,
            },
            ticks: {
              format: (value) => nameById.get(String(value)) ?? String(value),
            },
          },
        },
        y: {
          scale: scaleLinear().domain([0, maxTna > 0 ? maxTna * 1.12 : 1]),
          nice: true,
          grid: { stroke: gridLineColor.value },
          axis: {
            label: 'TNA (%)',
            ticks: {
              format: (value) => `${Number(value).toFixed(1)}%`,
            },
          },
        },
      },
      theme: {
        foreground: textColor.value,
        muted,
        grid: gridLineColor.value,
        background: 'transparent',
        palette: ['#10b981'],
      },
    },
    {
      svgAnimation: false,
      tooltip: {
        use: tooltip,
        content: (focused) => {
          const row = focused[0]?.datum
          if (!row) return { rows: [] }
          return {
            title: row.name,
            color: '#10b981',
            rows: [{ label: 'TNA', value: `${row.tna.toFixed(2)}%` }],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="w-full min-h-96">
    <Chart
      v-if="points.length"
      :definition="definition"
      :height="384"
      aria-label="Comparación de TNA"
      class="w-full"
      @render="paintLogos"
    />
    <div v-else class="py-12 text-center text-sm text-neutral-500">Sin datos para el gráfico.</div>
  </div>
</template>
