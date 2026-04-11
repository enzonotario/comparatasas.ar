<script setup lang="ts">
import type { PlazoFijoUvaPagoPeriodicoItem } from '~/composables/usePlazosFijosUvaPagoPeriodico'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  items: PlazoFijoUvaPagoPeriodicoItem[]
  selectedDays: number
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

/** top: espacio para etiquetas sobre cada barra */
const padding = { top: 56, right: 20, bottom: 44, left: 52 }
/** viewBox interno (coordenadas lógicas). */
const vb = { w: 900, h: 500 }

const bounds = computed(() => {
  const rows = props.items.filter((i) => i.tna > 0)
  if (!rows.length) return null
  const minD = Math.min(...rows.map((r) => r.plazoMinDias))
  const maxD = Math.max(...rows.map((r) => r.plazoMaxDias))
  const minT = Math.min(...rows.map((r) => r.tna))
  const maxT = Math.max(...rows.map((r) => r.tna))
  const spanT = maxT - minT || 1
  const padT = Math.max(0.25, spanT * 0.12)
  return {
    minD,
    maxD,
    minY: Math.max(0, minT - padT),
    maxY: maxT + padT,
  }
})

const rowsSorted = computed(() => {
  const rows = props.items.filter((i) => i.tna > 0)
  return [...rows].sort(
    (a, z) =>
      a.plazoMinDias - z.plazoMinDias || a.institution.localeCompare(z.institution, 'es-AR'),
  )
})

function xPx(d: number): number {
  const b = bounds.value
  if (!b) return 0
  const span = b.maxD - b.minD || 1
  const innerW = vb.w - padding.left - padding.right
  return padding.left + ((d - b.minD) / span) * innerW
}

function yPx(tna: number): number {
  const b = bounds.value
  if (!b) return 0
  const span = b.maxY - b.minY || 1
  const innerH = vb.h - padding.top - padding.bottom
  return padding.top + (1 - (tna - b.minY) / span) * innerH
}

/** Marcas del eje Y (TNA). */
const yTicks = computed(() => {
  const b = bounds.value
  if (!b) return []
  const n = 5
  const ticks: number[] = []
  for (let i = 0; i <= n; i++) {
    ticks.push(b.minY + (i / n) * (b.maxY - b.minY))
  }
  return ticks
})

/** Marcas del eje X (días). */
const xTicks = computed(() => {
  const b = bounds.value
  if (!b) return []
  const target = 8
  const span = b.maxD - b.minD || 1
  const step = Math.max(30, Math.ceil(span / target / 30) * 30)
  const ticks: number[] = []
  for (let d = Math.ceil(b.minD / step) * step; d <= b.maxD; d += step) {
    ticks.push(d)
  }
  if (ticks.length === 0 || ticks[0]! > b.minD) ticks.unshift(b.minD)
  if (ticks[ticks.length - 1]! < b.maxD) ticks.push(b.maxD)
  return [...new Set(ticks)].sort((a, z) => a - z)
})

const simX = computed(() => {
  const b = bounds.value
  if (!b) return null
  const d = props.selectedDays
  if (d < b.minD || d > b.maxD) return null
  return xPx(d)
})

function fmtPct(n: number): string {
  return `${n.toFixed(n < 10 ? 2 : 1)}%`
}

function segmentTitle(r: PlazoFijoUvaPagoPeriodicoItem): string {
  return `${r.institution} · ${r.plazoMinDias}–${r.plazoMaxDias} d · TNA ${fmtPct(r.tna)}`
}

function segCenterX(r: PlazoFijoUvaPagoPeriodicoItem): number {
  return (xPx(r.plazoMinDias) + xPx(r.plazoMaxDias)) / 2
}

/** Baseline Y de la línea de TNA (encima del trazo). */
function labelTnaY(r: PlazoFijoUvaPagoPeriodicoItem): number {
  return yPx(r.tna) - 22
}

/** Baseline Y del rango de días (debajo del %). */
function labelRangoY(r: PlazoFijoUvaPagoPeriodicoItem): number {
  return yPx(r.tna) - 8
}

/** Área sensible (etiquetas + barra) para hover / tooltip. */
function segmentHitRect(r: PlazoFijoUvaPagoPeriodicoItem) {
  const x1 = xPx(r.plazoMinDias)
  const x2 = xPx(r.plazoMaxDias)
  const x = Math.min(x1, x2)
  const width = Math.max(10, Math.abs(x2 - x1))
  const yTop = labelTnaY(r) - 6
  const yBottom = yPx(r.tna) + 10
  return {
    x,
    y: yTop,
    width,
    height: Math.max(22, yBottom - yTop),
  }
}

const TIP_OFFSET = 14

const hoverTip = ref<{
  x: number
  y: number
  row: PlazoFijoUvaPagoPeriodicoItem
} | null>(null)

function onTipEnter(r: PlazoFijoUvaPagoPeriodicoItem, e: MouseEvent) {
  hoverTip.value = {
    x: e.clientX + TIP_OFFSET,
    y: e.clientY + TIP_OFFSET,
    row: r,
  }
}

function onTipMove(e: MouseEvent) {
  if (!hoverTip.value) return
  hoverTip.value = {
    ...hoverTip.value,
    x: e.clientX + TIP_OFFSET,
    y: e.clientY + TIP_OFFSET,
  }
}

function onTipLeave() {
  hoverTip.value = null
}
</script>

<template>
  <div class="w-full min-w-0">
    <div
      v-if="bounds && rowsSorted.length"
      class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/30 overflow-x-auto"
    >
      <svg
        class="min-w-[min(100%,52rem)] w-full h-auto block"
        :viewBox="`0 0 ${vb.w} ${vb.h}`"
        role="img"
        aria-label="Gráfico escalera TNA por tramo de días"
      >
        <title>PF UVA pago periódico: TNA por rango de días</title>

        <!-- Grid horizontal -->
        <g v-for="(yt, i) in yTicks" :key="`gy-${i}`">
          <line
            :x1="padding.left"
            :x2="vb.w - padding.right"
            :y1="yPx(yt)"
            :y2="yPx(yt)"
            :stroke="gridLineColor"
            stroke-width="1"
            opacity="0.55"
          />
        </g>

        <!-- Eje Y etiquetas -->
        <g v-for="(yt, i) in yTicks" :key="`yl-${i}`">
          <text
            :x="padding.left - 8"
            :y="yPx(yt) + 4"
            text-anchor="end"
            font-size="11"
            :fill="textColor"
            font-family="inherit"
          >
            {{ fmtPct(yt) }}
          </text>
        </g>

        <!-- Eje X etiquetas -->
        <g v-for="(xd, i) in xTicks" :key="`xl-${i}`">
          <text
            :x="xPx(xd)"
            :y="vb.h - 12"
            text-anchor="middle"
            font-size="11"
            :fill="textColor"
            font-family="inherit"
          >
            {{ xd }}
          </text>
        </g>

        <!-- Ejes -->
        <line
          :x1="padding.left"
          :y1="padding.top"
          :x2="padding.left"
          :y2="vb.h - padding.bottom"
          :stroke="gridLineColor"
          stroke-width="1.5"
        />
        <line
          :x1="padding.left"
          :y1="vb.h - padding.bottom"
          :x2="vb.w - padding.right"
          :y2="vb.h - padding.bottom"
          :stroke="gridLineColor"
          stroke-width="1.5"
        />

        <!-- Línea referencia simulador -->
        <line
          v-if="simX != null"
          :x1="simX"
          :x2="simX"
          :y1="padding.top"
          :y2="vb.h - padding.bottom"
          class="text-primary-500"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-dasharray="5 4"
          opacity="0.85"
        />

        <!-- Segmentos horizontales (escalera) -->
        <g v-for="(r, i) in rowsSorted" :key="r.rowKey">
          <rect
            v-bind="segmentHitRect(r)"
            fill="transparent"
            class="cursor-pointer"
            @mouseenter="onTipEnter(r, $event)"
            @mousemove="onTipMove"
            @mouseleave="onTipLeave"
          />
          <line
            :x1="xPx(r.plazoMinDias)"
            :x2="xPx(r.plazoMaxDias)"
            :y1="yPx(r.tna)"
            :y2="yPx(r.tna)"
            :stroke="CHART_COLORS[i % CHART_COLORS.length]"
            stroke-width="12"
            stroke-linecap="round"
            pointer-events="none"
          >
            <title>{{ segmentTitle(r) }}</title>
          </line>
          <text :fill="textColor" font-family="inherit" text-anchor="middle" pointer-events="none">
            <tspan :x="segCenterX(r)" :y="labelTnaY(r)" font-size="11" font-weight="600">
              {{ fmtPct(r.tna) }}
            </tspan>
            <tspan :x="segCenterX(r)" :y="labelRangoY(r)" font-size="10" opacity="0.92">
              {{ r.plazoMinDias }}–{{ r.plazoMaxDias }} d
            </tspan>
          </text>
        </g>

        <!-- Etiquetas ejes nombre -->
        <text
          :x="(padding.left + vb.w - padding.right) / 2"
          :y="vb.h - 2"
          text-anchor="middle"
          font-size="12"
          font-weight="500"
          :fill="textColor"
          font-family="inherit"
        >
          Días de plazo
        </text>
        <text
          :x="14"
          :y="vb.h / 2"
          text-anchor="middle"
          font-size="12"
          font-weight="500"
          :fill="textColor"
          font-family="inherit"
          :transform="`rotate(-90, 14, ${vb.h / 2})`"
        >
          TNA (%)
        </text>
      </svg>
    </div>

    <p v-else class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
      No hay datos para el gráfico.
    </p>

    <Teleport to="body">
      <div
        v-if="hoverTip"
        class="fixed z-[300] pointer-events-none max-w-xs rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-lg dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        :style="{ left: `${hoverTip.x}px`, top: `${hoverTip.y}px` }"
        role="tooltip"
      >
        <p class="font-semibold leading-snug">{{ hoverTip.row.institution }}</p>
        <p class="mt-1.5 text-neutral-600 dark:text-neutral-300">
          TNA: {{ fmtPct(hoverTip.row.tna) }}
        </p>
        <p class="text-neutral-600 dark:text-neutral-300">
          Plazo: {{ hoverTip.row.plazoMinDias }}–{{ hoverTip.row.plazoMaxDias }} días
        </p>
      </div>
    </Teleport>
  </div>
</template>
