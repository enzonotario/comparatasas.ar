<script setup lang="ts">
import { defineChart, dot, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import {
  PROVIDER_LOGO_PAIR_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'
import { hideOverlappingYieldLabels } from '~/lib/charts/yield-label-collision'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const logos = computed(() =>
  providerLogoMap(props.accounts.map((account) => ({ name: account.fondo, logo: account.logo }))),
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
  hasLimit: boolean
  color: string
}

const definition = computed(() => {
  const accountsWithTope = props.accounts.filter(
    (account) => account.tope != null && account.tope > 0,
  )
  const accountsWithoutLimit = props.accounts.filter(
    (account) => account.tope == null || account.tope <= 0,
  )

  const maxTope =
    accountsWithTope.length > 0
      ? Math.max(...accountsWithTope.map((account) => account.tope!))
      : 1000000
  const sinLimiteValue = maxTope * 1.5
  const hasUnlimited = accountsWithoutLimit.length > 0

  const sortedAccountsWithTope = [...accountsWithTope].sort((a, b) => b.tna - a.tna)
  const sortedAccountsWithoutLimit = [...accountsWithoutLimit].sort((a, b) => b.tna - a.tna)

  const rows: ScatterRow[] = [
    ...sortedAccountsWithTope.map((account, index) => ({
      id: `${account.fondo}-${index}`,
      x: account.tope!,
      y: account.tna * 100,
      name: account.fondo,
      hasLimit: true,
      color: CHART_COLORS[index % CHART_COLORS.length]!,
    })),
    ...sortedAccountsWithoutLimit.map((account, index) => ({
      id: `${account.fondo}-sin-limite-${index}`,
      x: sinLimiteValue,
      y: account.tna * 100,
      name: account.fondo,
      hasLimit: false,
      color: CHART_COLORS[(sortedAccountsWithTope.length + index) % CHART_COLORS.length]!,
    })),
  ]

  if (rows.length === 0) return null

  const outline = textColor.value === '#fff' ? '#000' : '#fff'
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }
  const labelDx = (row: ScatterRow) => (logos.value.has(row.name) ? PROVIDER_LOGO_PAIR_DX : 0)

  function formatTopeTick(value: number): string {
    if (hasUnlimited && Math.abs(value - sinLimiteValue) <= Math.max(sinLimiteValue * 0.01, 1)) {
      return 'Sin Límite'
    }
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
    return `$${value}`
  }

  function topeTicks(): number[] {
    const span = Math.max(maxTope, 1)
    const rough = span / 4
    const mag = 10 ** Math.floor(Math.log10(rough))
    const normalized = rough / mag
    const nice = normalized >= 7.5 ? 10 : normalized >= 3.5 ? 5 : normalized >= 1.5 ? 2 : 1
    const step = Math.max(nice * mag, 1)
    const ticks: number[] = []
    for (let value = 0; value <= maxTope + step * 0.01; value += step) ticks.push(value)
    ticks.push(sinLimiteValue)
    return ticks
  }

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
          scale: hasUnlimited ? scaleLinear().domain([0, sinLimiteValue * 1.08]) : scaleLinear,
          nice: !hasUnlimited,
          grid: false,
          axis: {
            label: 'Tope (ARS)',
            ticks: hasUnlimited
              ? { values: topeTicks(), format: formatTopeTick }
              : { format: formatTopeTick },
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
              { label: 'Tope', value: row.hasLimit ? formatCurrency(row.x) : 'Sin Límite' },
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
      aria-label="Dispersión de TNA y tope de cuentas"
      class="h-full w-full"
      :height="384"
      @render="onRender"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
