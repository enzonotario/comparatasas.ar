<script setup lang="ts">
import 'vue-data-ui/style.css'
import type { VueUiCirclePackConfig, VueUiCirclePackDatasetItem } from 'vue-data-ui'
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiChart } from '~/composables/useVueDataUiChart'
import { useVueDataUiSolidTooltip } from '~/composables/useVueDataUiSolidTooltip'

interface Props {
  funds: ProcessedFund[]
}

const GROUP_ORDER = [
  { id: 'mm' as const, name: 'Money Market' },
  { id: 'rf' as const, name: 'Renta fija' },
  { id: 'rm' as const, name: 'Renta mixta' },
  { id: 'rv' as const, name: 'Renta variable' },
  { id: 'ot' as const, name: 'Otros' },
]

function fundCategory(f: ProcessedFund): (typeof GROUP_ORDER)[number]['id'] {
  const t = f.type || ''
  if (t === 'mercadoDinero' || t === 'mercadoDineroUsd') return 'mm'
  if (t === 'rentaFija' || t === 'rentaFijaUsd') return 'rf'
  if (t === 'rentaMixta') return 'rm'
  if (t === 'rentaVariable') return 'rv'
  return 'ot'
}

function formatPatrimonioCompact(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(n)
}

function valueLabelFormatter(payload: unknown): string {
  const raw =
    typeof payload === 'object' &&
    payload !== null &&
    'value' in payload &&
    typeof (payload as { value: unknown }).value === 'number'
      ? (payload as { value: number }).value
      : typeof payload === 'number'
        ? payload
        : Number(payload)
  if (!Number.isFinite(raw)) return ''
  return formatPatrimonioCompact(raw)
}

const props = defineProps<Props>()

const chart = useVueDataUiChart('VueUiCirclePack')
const { textColor, gridLineColor } = useChartTheme()
const solidTooltip = useVueDataUiSolidTooltip()

const sortByPatrimonioDesc = (a: ProcessedFund, b: ProcessedFund) =>
  (b.patrimonio || 0) - (a.patrimonio || 0)

/** Dataset + mapa para tooltip (VueUiCirclePack usa items planos; ver documentación). */
const packModel = computed(() => {
  const withP = props.funds.filter(
    (f) => f.patrimonio != null && f.patrimonio !== undefined && f.patrimonio > 0,
  )
  if (!withP.length) {
    return {
      dataset: [] as VueUiCirclePackDatasetItem[],
      fundByLabel: new Map<string, ProcessedFund>(),
    }
  }

  const buckets: Record<string, ProcessedFund[]> = {
    mm: [],
    rf: [],
    rm: [],
    rv: [],
    ot: [],
  }
  for (const f of withP) {
    buckets[fundCategory(f)].push(f)
  }

  const dataset: VueUiCirclePackDatasetItem[] = []
  const fundByLabel = new Map<string, ProcessedFund>()
  let colorOffset = 0

  for (const { id, name: groupName } of GROUP_ORDER) {
    const list = [...buckets[id]!].sort(sortByPatrimonioDesc)
    for (const f of list) {
      const label = `${groupName} · ${f.displayName || f.fondo}`
      const pat = f.patrimonio || 0
      dataset.push({
        name: label,
        value: pat,
        color: CHART_COLORS[colorOffset % CHART_COLORS.length],
      })
      fundByLabel.set(label, f)
      colorOffset += 1
    }
  }

  return { dataset, fundByLabel }
})

const chartConfig = computed<VueUiCirclePackConfig>(() => ({
  responsive: true,
  theme: '',
  customPalette: CHART_COLORS,
  userOptions: { show: false },
  table: { show: false },
  style: {
    fontFamily: 'inherit',
    chart: {
      backgroundColor: 'transparent',
      color: textColor.value,
      height: 440,
      title: {
        text: '',
        color: textColor.value,
      },
      circles: {
        stroke: gridLineColor.value,
        strokeWidth: 1,
        gradient: {
          show: true,
          intensity: 28,
        },
        labels: {
          name: {
            show: true,
            bold: false,
            color: textColor.value,
            fontSizeRatio: 0.11,
            offsetY: 0,
          },
          value: {
            show: true,
            bold: true,
            color: textColor.value,
            rounding: 0,
            prefix: '',
            suffix: '',
            formatter: valueLabelFormatter,
            fontSizeRatio: 0.1,
            offsetY: 2,
          },
        },
      },
      tooltip: {
        show: true,
        ...solidTooltip.value,
        showValue: true,
        showPercentage: false,
        roundingValue: 0,
        prefix: '',
        suffix: '',
        customFormat: (params) => {
          const raw = params.datapoint as { name?: string } | { name?: string }[] | undefined
          const dp = Array.isArray(raw) ? raw[0] : raw
          const label = dp?.name ?? ''
          const fund = packModel.value.fundByLabel.get(label)
          const pat = fund?.patrimonio != null ? formatCurrency(Number(fund.patrimonio)) : ''
          const tna = fund != null ? `<br/>TNA: ${(fund.tna * 100).toFixed(2)}%` : ''
          return `<div style="font-family:inherit"><b>${label}</b><br/>Patrimonio: ${pat}${tna}</div>`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="w-full max-w-5xl min-h-96 [&_svg]:max-w-full [&_svg]:h-auto mx-auto">
    <ClientOnly>
      <component
        :is="chart"
        v-if="chart && packModel.dataset.length > 0"
        :dataset="packModel.dataset"
        :config="chartConfig"
      />
      <div
        v-else-if="chart && packModel.dataset.length === 0"
        class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
      >
        Sin datos de patrimonio para el gráfico.
      </div>
      <div v-else class="w-full min-h-96 flex items-center justify-center text-neutral-500">
        Cargando gráfico…
      </div>
    </ClientOnly>
  </div>
</template>
