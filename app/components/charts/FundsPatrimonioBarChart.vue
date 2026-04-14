<script setup lang="ts">
import type { Component } from 'vue'
import 'vue-data-ui/style.css'
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

type BarChild = {
  name: string
  value: number
  color: string
  logo?: string
  rightLabel?: string
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

/** vue-data-ui pasa `{ value, config }` al formatter de etiquetas. */
function dataLabelCurrencyFormatter(payload: unknown): string {
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

const BAR_GAP = 4
const BAR_PARENT_FS = 9
const BAR_NAME_FS = 9
const BAR_DATA_FS = 9
const BAR_L = BAR_PARENT_FS * 3
const BAR_MIN_ROW = 24
const BAR_TAIL = 24
const BAR_LIB_PAD_V = 24
const BAR_LIB_TOP = 9
const LOGO_PX = 9
const BAR_CHART_WIDTH = 520
const BAR_RIGHT_LABEL_PAD = 88

const props = defineProps<Props>()

const { textColor, gridLineColor, colorMode } = useChartTheme()
const horizontalBarComponent = shallowRef<Component | null>(null)
const logoClipUid = `pat-bar-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`

onMounted(async () => {
  const { VueUiHorizontalBar } = await import('vue-data-ui/vue-ui-horizontal-bar')
  horizontalBarComponent.value = VueUiHorizontalBar
})

const chartDataset = computed(() => {
  const withP = props.funds.filter(
    (f) => f.patrimonio != null && f.patrimonio !== undefined && f.patrimonio > 0,
  )
  if (!withP.length) return []

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

  const sortByPatrimonioDesc = (a: ProcessedFund, b: ProcessedFund) =>
    (b.patrimonio || 0) - (a.patrimonio || 0)

  let colorOffset = 0
  const groups: Array<{ name: string; value: number; children: BarChild[] }> = []

  for (const { id, name: groupName } of GROUP_ORDER) {
    const list = [...buckets[id]!].sort(sortByPatrimonioDesc)
    if (!list.length) continue

    const children: BarChild[] = list.map((f, i) => {
      const idx = colorOffset + i
      const pat = f.patrimonio || 0
      return {
        name: f.displayName || f.fondo,
        value: pat,
        color: CHART_COLORS[idx % CHART_COLORS.length],
        logo: f.logo,
        rightLabel: `TNA ${(f.tna * 100).toFixed(2)}%`,
      }
    })
    colorOffset += children.length

    const maxV = Math.max(...children.map((c) => c.value))
    groups.push({
      name: groupName,
      value: maxV,
      children,
    })
  }

  return groups
})

const chartHeight = computed(() => {
  return 400
})

const chartConfig = computed<any>(() => ({
  skeletonDataset: null,
  skeletonConfig: null,
  debug: false,
  loading: false,
  autoSize: false,
  responsive: false,
  theme: '',
  customPalette: CHART_COLORS,
  useCssAnimation: false,
  a11y: {
    translations: {
      keyboardNavigation:
        'Use the left and right, or up and down arrow keys to move between datapoints',
      tableAvailable: 'A data table for this chart is available below.',
      tableCaption: 'Chart data table',
    },
  },
  events: {
    datapointEnter: null,
    datapointLeave: null,
    datapointClick: null,
  },
  style: {
    fontFamily: 'inherit',
    chart: {
      backgroundColor: 'transparent',
      color: textColor.value,
      width: BAR_CHART_WIDTH,
      height: chartHeight.value,
      layout: {
        bars: {
          rowColor: null,
          rowRadius: 3,
          sort: 'none',
          useStroke: false,
          strokeWidth: 2,
          height: 26,
          gap: BAR_GAP,
          borderRadius: 3,
          offsetX: 56,
          paddingRight: BAR_RIGHT_LABEL_PAD,
          useGradient: true,
          gradientIntensity: 32,
          fillOpacity: 100,
          underlayerColor: 'transparent',
          dataLabels: {
            color: textColor.value,
            bold: true,
            fontSize: BAR_DATA_FS,
            value: {
              show: true,
              roundingValue: 0,
              prefix: '',
              suffix: '',
              formatter: dataLabelCurrencyFormatter,
            },
            percentage: {
              show: false,
              roundingPercentage: 0,
            },
            offsetX: 0,
          },
          nameLabels: {
            show: true,
            color: textColor.value,
            bold: false,
            fontSize: BAR_NAME_FS,
            offsetX: 0,
          },
          parentLabels: {
            show: true,
            color: textColor.value,
            bold: false,
            fontSize: BAR_PARENT_FS,
            offsetX: 4,
            paddingBottom: 0,
          },
        },
        highlighter: {
          color: textColor.value,
          opacity: 5,
        },
        separators: {
          show: false,
          color: gridLineColor.value,
          strokeWidth: 1,
          fullWidth: true,
        },
      },
      title: {
        text: '',
        color: textColor.value,
        fontSize: 20,
        bold: true,
        textAlign: 'center',
        paddingLeft: 0,
        paddingRight: 0,
        subtitle: {
          color: '#A1A1A1',
          text: '',
          fontSize: 16,
          bold: false,
        },
      },
      legend: {
        show: false,
        bold: false,
        backgroundColor: 'transparent',
        color: textColor.value,
        fontSize: 14,
        selectAllToggle: {
          show: false,
          backgroundColor: '#e1e5e8',
          color: textColor.value,
        },
        position: 'top',
        roundingValue: 0,
        roundingPercentage: 0,
        prefix: '',
        suffix: '',
      },
      tooltip: {
        show: true,
        color: textColor.value,
        backgroundColor: '#FFFFFF',
        fontSize: 14,
        customFormat: ({ datapoint }: { datapoint: { name?: string; value?: number } }) => {
          const name = datapoint?.name ?? ''
          const p = datapoint?.value != null ? formatCurrency(Number(datapoint.value)) : ''
          const fund = props.funds.find((f) => (f.displayName || f.fondo) === name)
          const tna = fund != null ? `<br/>TNA: ${(fund.tna * 100).toFixed(2)}%` : ''
          return `<div style="font-family:inherit"><b>${name}</b><br/>Patrimonio: ${p}${tna}</div>`
        },
        borderRadius: 4,
        borderColor: '#e1e5e8',
        borderWidth: 1,
        backgroundOpacity: 100,
        position: 'center',
        offsetY: 24,
        smooth: true,
        backdropFilter: false,
        smoothForce: 0.18,
        smoothSnapThreshold: 0.25,
        teleportTo: 'body',
        showValue: true,
        showPercentage: false,
        roundingValue: 0,
        roundingPercentage: 0,
        prefix: '',
        suffix: '',
        fontSize: BAR_DATA_FS,
      },
    },
  },
  userOptions: {
    show: false,
    showOnChartHover: false,
    keepStateOnChartLeave: true,
    position: 'right',
    buttons: {
      tooltip: true,
      pdf: false,
      csv: false,
      img: false,
      table: false,
      labels: false,
      fullscreen: false,
      sort: false,
      stack: false,
      animation: false,
      annotator: false,
      svg: false,
      zoom: false,
      altCopy: false,
    },
    callbacks: {
      animation: null,
      annotator: null,
      csv: null,
      fullscreen: null,
      img: null,
      labels: null,
      pdf: null,
      sort: null,
      stack: null,
      table: null,
      tooltip: null,
      svg: null,
      zoom: null,
      altCopy: null,
    },
    buttonTitles: {
      open: 'Open options',
      close: 'Close options',
      tooltip: 'Toggle tooltip',
      pdf: 'Download PDF',
      csv: 'Download CSV',
      img: 'Download PNG',
      table: 'Toggle table',
      fullscreen: 'Toggle fullscreen',
      sort: 'Toggle sort',
      annotator: 'Toggle annotator',
      svg: 'Download SVG',
      altCopy: 'Copy alt text',
    },
    print: {
      scale: 2,
      orientation: 'auto',
      overflowTolerance: 0.2,
    },
    useCursorPointer: false,
  },
  table: {
    show: false,
    responsiveBreakpoint: 400,
    useDialog: false,
    th: {
      backgroundColor: '#FFFFFF',
      color: textColor.value,
      outline: 'none',
    },
    td: {
      backgroundColor: '#FFFFFF',
      color: textColor.value,
      outline: 'none',
      roundingValue: 0,
      roundingPercentage: 0,
      prefix: '',
      suffix: '',
    },
  },
  translations: {
    parentName: 'Serie',
    childName: 'Child',
    value: 'value',
    percentageToTotal: '%/total',
    percentageToSerie: '%/serie',
  },
}))

const barCaptionFill = computed(() => (colorMode.value === 'dark' ? '#a3a3a3' : '#525252'))

const barLogoLayout = computed(() => {
  const dataset = chartDataset.value
  const K = chartHeight.value
  const gap = BAR_GAP
  const paddingTop = BAR_LIB_TOP
  const nameFontSize = BAR_NAME_FS
  const showParent = true
  const parentFontSize = BAR_PARENT_FS
  const parentPaddingBottom = 0
  const Lpx = showParent ? parentFontSize * 3 + parentPaddingBottom : 0
  const LOGO = LOGO_PX
  const logoX = 6

  const flat: Array<{ key: string; logo?: string; rightLabel?: string }> = []
  for (const g of dataset) {
    g.children.forEach((c: BarChild, idx: number) => {
      flat.push({
        key: `${g.name}::${c.name}::${idx}`,
        logo: c.logo,
        rightLabel: c.rightLabel,
      })
    })
  }

  const bt = flat.length
  if (bt === 0)
    return [] as Array<{
      key: string
      logo?: string
      rightLabel?: string
      x: number
      y: number
      size: number
      textY: number
    }>

  const Acounts: number[] = []
  let parentBlocks = 0
  for (const g of dataset) {
    g.children.forEach((_c: BarChild, idx: number) => {
      if (idx === 0 && showParent) parentBlocks += 1
      Acounts.push(parentBlocks)
    })
  }

  const maxA = Math.max(0, ...Acounts)
  const d = (K - 24 - (bt - 1) * gap - maxA * Lpx) / bt

  return flat.map((row, o) => {
    const rowTextY = paddingTop + (gap + d) * o + d / 2 + nameFontSize / 3 + Acounts[o] * Lpx
    const y = rowTextY - LOGO / 2
    return {
      ...row,
      x: logoX,
      y,
      size: LOGO,
      textY: rowTextY,
    }
  })
})
</script>

<template>
  <div class="w-full max-w-5xl min-h-96 [&_svg]:max-w-full [&_svg]:h-auto mx-auto">
    <ClientOnly>
      <component
        :is="horizontalBarComponent"
        v-if="horizontalBarComponent && chartDataset.length > 0"
        :dataset="chartDataset"
        :config="chartConfig"
      >
        <template #svg>
          <defs>
            <template v-for="(pos, i) in barLogoLayout" :key="`clip-${pos.key}`">
              <clipPath v-if="pos.logo" :id="`${logoClipUid}-clip-${i}`">
                <rect :x="pos.x" :y="pos.y" :width="pos.size" :height="pos.size" rx="3" ry="3" />
              </clipPath>
            </template>
          </defs>
          <g class="pointer-events-none" aria-hidden="true">
            <template v-for="(pos, i) in barLogoLayout" :key="`img-${pos.key}`">
              <image
                v-if="pos.logo"
                :href="pos.logo"
                :x="pos.x"
                :y="pos.y"
                :width="pos.size"
                :height="pos.size"
                preserveAspectRatio="xMidYMid slice"
                :clip-path="`url(#${logoClipUid}-clip-${i})`"
              />
            </template>
          </g>
          <g class="pointer-events-none" aria-hidden="true">
            <text
              v-for="pos in barLogoLayout"
              v-show="pos.rightLabel"
              :key="`cap-${pos.key}`"
              :x="BAR_CHART_WIDTH - 6"
              :y="pos.textY"
              text-anchor="end"
              :fill="barCaptionFill"
              font-size="9"
              font-family="inherit"
              >{{ pos.rightLabel }}</text
            >
          </g>
        </template>
      </component>
      <div
        v-else-if="horizontalBarComponent && chartDataset.length === 0"
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

<style scoped>
:deep(.vue-ui-horizontal-bar-parent-label > text:last-of-type) {
  opacity: 0;
  pointer-events: none;
}
</style>
