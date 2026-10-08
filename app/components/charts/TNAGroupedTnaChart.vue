<script setup lang="ts">
import { barX, defineChart, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import {
  getVariableFundRiskLevel,
  VARIABLE_FUND_RISK_LABELS,
  VARIABLE_FUND_RISK_ORDER,
  type VariableFundRiskLevel,
} from '~/lib/variable-fund-risk'
import type { ProcessedFund } from '~/types/investments'
import {
  PROVIDER_AXIS_LOGO_DX,
  providerLogoMap,
  useProviderLogos,
} from '~/lib/charts/provider-logos'

const SECTION_GUARANTEED_NAMES = [
  'Rendimiento garantizado',
  'Rendimiento garantizado / Con condiciones especiales',
] as const
const SECTION_VARIABLE_NAMES = VARIABLE_FUND_RISK_ORDER.map(
  (level) => `Rendimiento Variable / ${VARIABLE_FUND_RISK_LABELS[level]}`,
)

interface Props {
  guaranteedAccounts: AccountItem[]
  specialAccounts: AccountItem[]
  variableFunds: ProcessedFund[]
  /**
   * `all`: un solo gráfico con los cuatro bloques (comportamiento clásico).
   * `guaranteed` | `variable`: solo esos grupos, para armar dos columnas en desktop.
   */
  section?: 'all' | 'guaranteed' | 'variable'
}

type BarChild = {
  name: string
  value: number
  color: string
  logo?: string
  rightLabel?: string
  condicionesCorto?: string
}

type RankBar = {
  id: string
  name: string
  group: string
  value: number
  valueLabel: string
  color: string
  logo?: string
  rightLabel?: string
  condicionesCorto?: string
}

function truncateBarCaption(s: string, max = 38): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function rightLabelForAccount(a: AccountItem): string {
  const parts: string[] = []
  if (a.tope != null && a.tope > 0) parts.push(`Límite ${formatCurrency(a.tope)}`)
  if (a.condicionesCorto?.trim()) parts.push(a.condicionesCorto.trim())
  return truncateBarCaption(parts.join(' · '))
}

function rightLabelForFund(f: ProcessedFund): string {
  const t = f.type || ''
  if (t === 'mercadoDinero' || t === 'mercadoDineroUsd')
    return truncateBarCaption('FCI · Money Market')
  if (t === 'rentaMixta') return truncateBarCaption('FCI · Renta  mixta')
  if (t === 'rentaFija' || t === 'rentaFijaUsd') return truncateBarCaption('FCI · Renta fija ')
  if (t === 'rentaVariable') return truncateBarCaption('FCI · Renta variable')
  if (t === 'retornoTotal') return truncateBarCaption('FCI · Retorno total')
  if (f.typeLabel) return truncateBarCaption(`FCI · ${f.typeLabel}`)
  return truncateBarCaption('FCI · Rendimiento variable')
}

const props = withDefaults(defineProps<Props>(), {
  section: 'all',
})
const { textColor, gridLineColor, colorMode } = useChartTheme()

const fullChartDataset = computed(() => {
  const sortChildrenByTnaDesc = (items: BarChild[]) =>
    [...items].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'es-AR'))

  const garantizado: BarChild[] = [...props.guaranteedAccounts]
    .sort((a, b) => b.tna - a.tna)
    .map((account, index) => ({
      name: account.fondo,
      value: account.tna * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
      logo: account.logo,
      rightLabel: rightLabelForAccount(account),
      condicionesCorto: account.condicionesCorto?.trim(),
    }))

  const conCondicionesEspeciales: BarChild[] = [...props.specialAccounts]
    .sort((a, b) => b.tna - a.tna)
    .map((account, index) => ({
      name: account.fondo,
      value: account.tna * 100,
      color: CHART_COLORS[(index + garantizado.length) % CHART_COLORS.length],
      logo: account.logo,
      rightLabel: rightLabelForAccount(account),
      condicionesCorto: account.condicionesCorto?.trim(),
    }))

  const fundsByRisk = VARIABLE_FUND_RISK_ORDER.reduce(
    (acc, level) => {
      acc[level] = []
      return acc
    },
    {} as Record<VariableFundRiskLevel, BarChild[]>,
  )

  let colorOffset = garantizado.length + conCondicionesEspeciales.length
  for (const fund of [...props.variableFunds].sort((a, b) => b.tna - a.tna)) {
    const level = getVariableFundRiskLevel(fund)
    fundsByRisk[level].push({
      name: fund.displayName || fund.fondo,
      value: fund.tna * 100,
      color: CHART_COLORS[colorOffset % CHART_COLORS.length],
      logo: fund.logo,
      rightLabel: rightLabelForFund(fund),
    })
    colorOffset += 1
  }

  const garantizadoSorted = sortChildrenByTnaDesc(garantizado)
  const conCondicionesEspecialesSorted = sortChildrenByTnaDesc(conCondicionesEspeciales)

  return [
    {
      name: 'Rendimiento garantizado',
      children: garantizadoSorted,
    },
    {
      name: 'Rendimiento garantizado / Con condiciones especiales',
      children: conCondicionesEspecialesSorted,
    },
    ...VARIABLE_FUND_RISK_ORDER.map((level) => ({
      name: `Rendimiento Variable / ${VARIABLE_FUND_RISK_LABELS[level]}`,
      children: sortChildrenByTnaDesc(fundsByRisk[level]),
    })),
  ].filter((group) => group.children.length > 0)
})

const chartDataset = computed(() => {
  const full = fullChartDataset.value
  if (props.section === 'all') return full
  const allow = new Set<string>(
    props.section === 'guaranteed' ? SECTION_GUARANTEED_NAMES : SECTION_VARIABLE_NAMES,
  )
  return full.filter((group) => allow.has(group.name))
})

const rankModel = computed(() => {
  const bars: RankBar[] = []
  const domain: string[] = []
  const tickLabel = new Map<string, string>()
  const headerIds = new Set<string>()

  chartDataset.value.forEach((group, groupIndex) => {
    const headerId = `group:${groupIndex}:${group.name}`
    domain.push(headerId)
    tickLabel.set(headerId, group.name)
    headerIds.add(headerId)

    group.children.forEach((child, index) => {
      const id = `bar:${groupIndex}:${index}:${child.name}`
      domain.push(id)
      tickLabel.set(id, child.name)
      bars.push({
        id,
        name: child.name,
        group: group.name,
        value: child.value,
        valueLabel: `${child.value.toFixed(2)}%`,
        color: child.color,
        logo: child.logo,
        rightLabel: child.rightLabel,
        condicionesCorto: child.condicionesCorto,
      })
    })
  })

  const maxValue = bars.reduce((max, bar) => Math.max(max, bar.value), 0)
  const logos = providerLogoMap(bars)

  return { bars, domain, tickLabel, headerIds, maxValue, logos }
})

const { onRender: paintLogos } = useProviderLogos(() => rankModel.value.logos, 'after')

const chartRootClass = computed(() => {
  if (props.section === 'all') return 'w-full max-w-xl'
  return 'w-full min-w-0'
})

const chartHeight = computed(() => {
  const count = rankModel.value.domain.length
  if (count === 0) return 280
  return Math.max(280, 56 + count * 28)
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
          fillOpacity: 0.9,
          maxThickness: 20,
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
          scale: scaleLinear().domain([0, maxValue > 0 ? maxValue * 1.22 : 1]),
          grid: { stroke: gridLineColor.value },
          axis: {
            label: 'TNA (%)',
            ticks: {
              format: (value) => `${Number(value).toFixed(0)}%`,
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
          const rows = [
            { label: 'Grupo', value: bar.group },
            { label: 'TNA', value: bar.valueLabel },
          ]
          if (bar.rightLabel) rows.push({ label: 'Detalle', value: bar.rightLabel })
          if (bar.condicionesCorto) rows.push({ label: 'Condiciones', value: bar.condicionesCorto })
          return {
            title: bar.name,
            color: bar.color,
            rows,
          }
        },
      },
    },
  )
})
</script>

<template>
  <div :class="chartRootClass">
    <Chart
      v-if="rankModel.bars.length"
      :definition="definition"
      :height="chartHeight"
      aria-label="Comparación de TNA por grupos"
      class="w-full"
      @render="paintLogos"
    />
    <div v-else class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
      No hay datos en esta categoría.
    </div>
  </div>
</template>
