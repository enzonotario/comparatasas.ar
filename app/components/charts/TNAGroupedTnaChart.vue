<script setup lang="ts">
import type { Component } from 'vue'
import 'vue-data-ui/style.css'
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiSolidTooltip } from '~/composables/useVueDataUiSolidTooltip'
import type { ProcessedFund } from '~/types/investments'

const SECTION_GUARANTEED_NAMES = [
  'Rendimiento garantizado',
  'Rendimiento garantizado / Con condiciones especiales',
] as const
const SECTION_VARIABLE_NAMES = [
  'Rendimiento Variable / Riesgo muy bajo',
  'Rendimiento Variable / Riesgo moderado',
] as const

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
  /** Condiciones / límite (cuentas) o tipo FCI (fondos), columna derecha del SVG. */
  rightLabel?: string
}

function truncateBarCaption(s: string, max = 38): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function escapeTooltipHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  if (f.typeLabel) return truncateBarCaption(`FCI · ${f.typeLabel}`)
  return truncateBarCaption('FCI · Rendimiento variable')
}

/** Compactación vertical (debe coincidir con layout.bars en chartConfig y con barLogoLayout). */
const BAR_GAP = 4
const BAR_PARENT_FS = 11
const BAR_NAME_FS = 11
const BAR_DATA_FS = 11
const BAR_L = BAR_PARENT_FS * 3
const BAR_MIN_ROW = 20
const BAR_TAIL = 24
/** padding top/bottom fijos en vue-data-ui (K - 24 en la fórmula de d). */
const BAR_LIB_PAD_V = 24
const BAR_LIB_TOP = 12
const LOGO_PX = 18
/** Mismo valor que style.chart.width (viewBox). */
const BAR_CHART_WIDTH = 520
/** Suma al margen derecho interno (64 + paddingRight) para columna de condiciones. */
const BAR_RIGHT_LABEL_PAD = 96

const props = withDefaults(defineProps<Props>(), {
  section: 'all',
})
const { textColor, gridLineColor, colorMode } = useChartTheme()
const solidTooltip = useVueDataUiSolidTooltip()
const horizontalBarComponent = shallowRef<Component | null>(null)
/** IDs únicos para clipPath (válidos en SVG y sin colisiones entre instancias). */
const logoClipUid = `tna-bar-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`

onMounted(async () => {
  const { VueUiHorizontalBar } = await import('vue-data-ui')
  horizontalBarComponent.value = VueUiHorizontalBar
})

/** Dataset completo (cuatro grupos); la prop `section` filtra para layouts en columnas. */
const fullChartDataset = computed(() => {
  // Con sort "desc" la librería también reordena los PADRES por value → Variable pasa arriba.
  // sort "none" mantiene el orden del dataset: primero Garantizado (tasa fija → condiciones),
  // luego Variable (riesgo muy bajo → moderado). Los hijos los ordenamos nosotros.
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
    }))

  const conCondicionesEspeciales: BarChild[] = [...props.specialAccounts]
    .sort((a, b) => b.tna - a.tna)
    .map((account, index) => ({
      name: account.fondo,
      value: account.tna * 100,
      color: CHART_COLORS[(index + garantizado.length) % CHART_COLORS.length],
      logo: account.logo,
      rightLabel: rightLabelForAccount(account),
    }))

  const riesgoMuyBajo: BarChild[] = [...props.variableFunds]
    .filter((fund) => !['rentaFija', 'rentaMixta'].includes(fund.type || ''))
    .sort((a, b) => b.tna - a.tna)
    .map((fund, index) => ({
      name: fund.displayName || fund.fondo,
      value: fund.tna * 100,
      color:
        CHART_COLORS[
          (index + garantizado.length + conCondicionesEspeciales.length) % CHART_COLORS.length
        ],
      logo: fund.logo,
      rightLabel: rightLabelForFund(fund),
    }))

  const riesgoModerado: BarChild[] = [...props.variableFunds]
    .filter((fund) => ['rentaFija', 'rentaMixta'].includes(fund.type || ''))
    .sort((a, b) => b.tna - a.tna)
    .map((fund, index) => ({
      name: fund.displayName || fund.fondo,
      value: fund.tna * 100,
      color:
        CHART_COLORS[
          (index + garantizado.length + conCondicionesEspeciales.length + riesgoMuyBajo.length) %
            CHART_COLORS.length
        ],
      logo: fund.logo,
      rightLabel: rightLabelForFund(fund),
    }))

  const getGroupValue = (items: Array<{ value: number }>) =>
    items.length > 0 ? Math.max(...items.map((item) => item.value)) : 0

  const garantizadoSorted = sortChildrenByTnaDesc(garantizado)
  const conCondicionesEspecialesSorted = sortChildrenByTnaDesc(conCondicionesEspeciales)
  const riesgoMuyBajoSorted = sortChildrenByTnaDesc(riesgoMuyBajo)
  const riesgoModeradoSorted = sortChildrenByTnaDesc(riesgoModerado)

  // Orden fijo: 1) Garantizado (tasa fija, condiciones) 2) Variable (muy bajo, moderado)
  return [
    {
      name: 'Rendimiento garantizado',
      value: getGroupValue(garantizadoSorted),
      children: garantizadoSorted,
    },
    {
      name: 'Rendimiento garantizado / Con condiciones especiales',
      value: getGroupValue(conCondicionesEspecialesSorted),
      children: conCondicionesEspecialesSorted,
    },
    {
      name: 'Rendimiento Variable / Riesgo muy bajo',
      value: getGroupValue(riesgoMuyBajoSorted),
      children: riesgoMuyBajoSorted,
    },
    {
      name: 'Rendimiento Variable / Riesgo moderado',
      value: getGroupValue(riesgoModeradoSorted),
      children: riesgoModeradoSorted,
    },
  ].filter((group) => group.children.length > 0)
})

const chartDataset = computed(() => {
  const full = fullChartDataset.value
  if (props.section === 'all') return full
  const allow = new Set<string>(
    props.section === 'guaranteed' ? SECTION_GUARANTEED_NAMES : SECTION_VARIABLE_NAMES,
  )
  return full.filter((g) => allow.has(g.name))
})

const chartRootClass = computed(() => {
  const base = 'w-full [&_svg]:max-w-full [&_svg]:h-auto'
  if (props.section === 'all') return `${base} max-w-xl`
  return `${base} min-w-0`
})

/** Altura acorde al layout real del chart (solo filas-hijo + bloques de título padre), sin filas extra por grupo. */
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
          // Margen izquierdo extra (logo ~22px + aire); NO usar nameLabels.offsetX para eso:
          // con text-anchor "end", un offset ahí empuja el texto *sobre* el inicio de la barra.
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
              formatter: null,
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

/** Posiciones Y alineadas al layout interno de VueUiHorizontalBar (misma fórmula que el bundle). */
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
        No hay datos en esta categoría.
      </div>
      <div v-else class="w-full min-h-96 flex items-center justify-center">
        <div class="text-neutral-500">Cargando gráfico...</div>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Porcentaje duplicado bajo el título de grupo (vue-data-ui pinta nombre + valor en dos <text>) */
:deep(.vue-ui-horizontal-bar-parent-label > text:last-of-type) {
  opacity: 0;
  pointer-events: none;
}
</style>
