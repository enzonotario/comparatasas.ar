<script setup lang="ts">
import type { Component } from 'vue'
import 'vue-data-ui/style.css'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiSolidTooltip } from '~/composables/useVueDataUiSolidTooltip'

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

type BarChild = {
  name: string
  value: number
  color: string
  logo?: string
  rightLabel?: string
}

function escapeTooltipHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatTnaPreservingPrecision(value: number | string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'

  // Evita ceros de más y mantiene los decimales relevantes.
  return n.toFixed(6).replace(/\.?0+$/, '')
}

/** Mismas constantes que TNAGroupedTnaChart (VueUiHorizontalBar + slot #svg). */
const BAR_GAP = 4
const BAR_PARENT_FS = 11
const BAR_NAME_FS = 11
const BAR_DATA_FS = 11
const BAR_L = BAR_PARENT_FS * 3
const BAR_MIN_ROW = 20
const BAR_TAIL = 24
const BAR_LIB_PAD_V = 24
const BAR_LIB_TOP = 12
const LOGO_PX = 18
const BAR_CHART_WIDTH = 520
const BAR_RIGHT_LABEL_PAD = 96

const { textColor, gridLineColor, colorMode } = useChartTheme()
const solidTooltip = useVueDataUiSolidTooltip()
const horizontalBarComponent = shallowRef<Component | null>(null)
const logoClipUid = `pf-tna-bar-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`

onMounted(async () => {
  const { VueUiHorizontalBar } = await import('vue-data-ui/vue-ui-horizontal-bar')
  horizontalBarComponent.value = VueUiHorizontalBar
})

const chartDataset = computed(() => {
  const sorted = [...props.items]
    .filter((i) => i.tna > 0)
    .sort((a, b) => (props.sortTnaAscending ? a.tna - b.tna : b.tna - a.tna))
  if (sorted.length === 0) return []

  const children: BarChild[] = sorted.map((item, index) => ({
    name: item.institution,
    value: item.tna,
    color: CHART_COLORS[index % CHART_COLORS.length],
    logo: item.logo,
    rightLabel: '',
  }))

  const value = Math.max(...children.map((c) => c.value))

  return [
    {
      name: props.parentGroupName,
      value,
      children,
    },
  ]
})

/** Misma idea que TNAGroupedTnaChart en layout de columna (`section !== 'all'`). */
const chartRootClass = 'w-full min-w-0 [&_svg]:max-w-full [&_svg]:h-auto'

const chartHeight = computed(() => {
  const ds = chartDataset.value
  const bt = ds.reduce((s, g) => s + g.children.length, 0)
  const numGroups = ds.length
  if (bt === 0) return 420
  return Math.max(
    280,
    BAR_LIB_PAD_V + (bt - 1) * BAR_GAP + numGroups * BAR_L + bt * BAR_MIN_ROW + BAR_TAIL,
  )
})

const chartConfig = computed<any>(() => ({
  skeletonDataset: null,
  skeletonConfig: null,
  debug: false,
  loading: false,
  autoSize: false,
  // Si responsive cambia width/height internos, las coordenadas del slot #svg dejan de coincidir con las barras.
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
          height: 22,
          gap: BAR_GAP,
          borderRadius: 3,
          offsetX: 56,
          paddingRight: BAR_RIGHT_LABEL_PAD,
          useGradient: true,
          gradientIntensity: 20,
          fillOpacity: 90,
          underlayerColor: 'transparent',
          dataLabels: {
            color: textColor.value,
            bold: true,
            fontSize: BAR_DATA_FS,
            value: {
              show: true,
              roundingValue: 0,
              prefix: '',
              suffix: '%',
              formatter: props.preserveTnaPrecision
                ? ({ value }: { value: number | string }) => formatTnaPreservingPrecision(value)
                : null,
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
        ...solidTooltip.value,
        show: true,
        customFormat: ({ datapoint }: { datapoint: { name?: string; value?: number } }) => {
          const name = datapoint?.name ?? ''
          const v = datapoint?.value
          const tna = v != null && Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : '—'
          return `<div style="font-family:inherit"><b>${escapeTooltipHtml(name)}</b><br/>TNA: ${tna}</div>`
        },
        showValue: false,
        showPercentage: false,
        roundingValue: 0,
        roundingPercentage: 0,
        prefix: '',
        suffix: '',
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
      pdf: true,
      csv: true,
      img: true,
      table: true,
      labels: false,
      fullscreen: true,
      sort: true,
      stack: false,
      animation: false,
      annotator: true,
      svg: true,
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
  <div :class="chartRootClass">
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
        class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400"
      >
        No hay datos para graficar.
      </div>
      <div v-else class="w-full min-h-96 flex items-center justify-center">
        <div class="text-neutral-500">Cargando gráfico...</div>
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
