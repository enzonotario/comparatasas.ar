<script setup lang="ts">
import { colorLegend, colorLegendItems, defineChart, dot, lineY } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/vue'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import { scaleUtc } from 'd3-scale'
import type { PlazoFijoPrecancelableItem } from '~/composables/usePlazosFijosPrecancelables'
import { formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'
import { providerLogoMap, useProviderLogos } from '~/lib/charts/provider-logos'
import {
  buildPrecancelableUvaTimelineSeries,
  sortUvaByDateAsc,
  subtractCalendarDaysYmd,
  type UvaIndexRow,
} from '~/lib/finance/plazo-fijo-uva-pago-periodico'

interface Props {
  uvaRows: UvaIndexRow[]
  item: PlazoFijoPrecancelableItem | null
  montoSimulacion: number
  /** Plazo contractual en días (define la fecha de colocación = último UVA − plazo) */
  diasContrato: number
  /** Un punto cada N días (1 = diario) */
  stepDias?: number
}

const props = withDefaults(defineProps<Props>(), {
  stepDias: 1,
})

const { textColor, gridLineColor } = useChartTheme()

const logos = computed(() => {
  const entidad = props.item?.institution ?? ''
  if (!entidad) return new Map<string, string>()
  return providerLogoMap([{ name: `UVA + TNA adic. (${entidad})`, logo: props.item?.logo }])
})

const { onRender: paintLogos } = useProviderLogos(logos, 'after')

const uvaSorted = computed(() => sortUvaByDateAsc(props.uvaRows))

/** Última cotización UVA en datos */
const fechaFinYmd = computed(() => {
  const rows = uvaSorted.value
  if (!rows.length) return null
  return rows[rows.length - 1]?.fecha.slice(0, 10) ?? null
})

/** Colocación: fecha fin − plazo en días (mismo criterio que “desde el pasado hasta hoy”) */
const fechaInicioYmd = computed(() => {
  const fin = fechaFinYmd.value
  if (!fin || props.diasContrato < 1) return null
  return subtractCalendarDaysYmd(fin, props.diasContrato)
})

function ymdToUtcDate(ymd: string): Date {
  const [y = 1970, m = 1, d = 1] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatFechaCorta(ymd: string): string {
  const [yy, mm, dd] = ymd.split('-').map(Number)
  if (!yy || !mm || !dd) return ymd
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(yy, mm - 1, dd)))
}

function formatAxisDate(value: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(value)
}

/** Variación % respecto al capital colocado (mismo criterio que el eje en pesos). */
function pctSobreCapital(monto: number, capital: number): string {
  if (!Number.isFinite(monto) || capital <= 0) return ''
  const pct = (monto / capital - 1) * 100
  const body = pct.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = pct > 0 ? '+' : ''
  return `${sign}${body} %`
}

const historyPoints = computed(() => {
  const item = props.item
  const fin = fechaFinYmd.value
  const inicio = fechaInicioYmd.value
  if (!item || !uvaSorted.value.length || !fin || !inicio) return []
  const tnaFrac = item.tna / 100
  const precFrac = item.tnaPrecancelacion == null ? null : item.tnaPrecancelacion / 100
  return buildPrecancelableUvaTimelineSeries({
    uvaSortedAsc: uvaSorted.value,
    montoInicial: props.montoSimulacion,
    fechaInicioYmd: inicio,
    fechaFinYmd: fin,
    tnaAdicionalAnualFraccion: tnaFrac,
    tnaPrecancelacionAnualFraccion: precFrac,
    stepDias: props.stepDias,
  })
})

interface HistoryRow {
  date: Date
  y: number
  series: string
  tooltipLabel: string
  fechaYmd: string
  diasDesdeInicio: number
  monto: number
  capital: number
}

const definition = computed(() => {
  const pts = historyPoints.value
  const entidad = props.item?.institution ?? ''
  const inicio = fechaInicioYmd.value
  const fin = fechaFinYmd.value
  if (!pts.length || !props.item || !inicio || !fin) return null

  const nameVencimiento = entidad ? `UVA + TNA adic. (${entidad})` : 'UVA + TNA adicional'
  const namePrec = 'Precancelación (solo TNA)'
  const capital = props.montoSimulacion
  const rows: HistoryRow[] = []
  for (const point of pts) {
    rows.push({
      date: ymdToUtcDate(point.fechaYmd),
      y: point.montoFinalUva,
      series: nameVencimiento,
      tooltipLabel: 'UVA + TNA adic.',
      fechaYmd: point.fechaYmd,
      diasDesdeInicio: point.diasDesdeInicio,
      monto: point.montoFinalUva,
      capital,
    })
    if (point.montoFinalPrecancelacion != null) {
      rows.push({
        date: ymdToUtcDate(point.fechaYmd),
        y: point.montoFinalPrecancelacion,
        series: namePrec,
        tooltipLabel: 'Solo TNA prec.',
        fechaYmd: point.fechaYmd,
        diasDesdeInicio: point.diasDesdeInicio,
        monto: point.montoFinalPrecancelacion,
        capital,
      })
    }
  }

  const seriesOrder = [...new Set(rows.map((row) => row.series))]
  const seriesColors = seriesOrder.map((series) => (series === namePrec ? '#f59e0b' : '#3b82f6'))
  const showMarkers = pts.length <= 90
  const grid = { stroke: gridLineColor.value, strokeOpacity: 1 }

  return defineChart(
    {
      marks: [
        lineY(rows, {
          x: 'date',
          y: 'y',
          z: 'series',
          color: 'series',
          strokeWidth: 2.5,
        }),
        ...(showMarkers
          ? [
              decorative(
                dot(rows, {
                  x: 'date',
                  y: 'y',
                  color: 'series',
                  r: 3,
                }),
              ),
            ]
          : []),
      ],
      scales: {
        x: {
          scale: scaleUtc,
          nice: true,
          grid: false,
          axis: {
            label: 'Fecha',
            ticks: { format: formatAxisDate },
            tickLabels: { thin: true },
          },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid,
          axis: {
            label: 'Monto (ARS)',
            ticks: { format: (value: number) => formatCurrencyFull(value) },
          },
        },
      },
      color: {
        domain: seriesOrder,
        range: seriesColors,
        legend: colorLegend({
          items: colorLegendItems({
            indicator: { shape: 'line' },
          }),
        }),
      },
      theme: {
        foreground: textColor.value,
        muted: textColor.value,
        grid: gridLineColor.value,
        background: 'transparent',
      },
    },
    {
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        portal,
        content: (points) => {
          const first = points[0]?.datum
          if (!first) return { rows: [] }
          const fechaStr = formatFechaCorta(first.fechaYmd)
          return {
            title: entidad || fechaStr,
            rows: [
              { label: 'Fecha', value: fechaStr },
              ...points.map((point) => {
                const pct = pctSobreCapital(point.datum.monto, point.datum.capital)
                const amount = formatCurrencyFull(point.datum.monto)
                return {
                  label: point.datum.tooltipLabel,
                  value: pct ? `${amount} (${pct} sobre capital inicial)` : amount,
                  color: point.color,
                }
              }),
              { label: 'Días desde colocación', value: String(first.diasDesdeInicio) },
            ],
          }
        },
      },
    },
  )
})

const rangoTexto = computed(() => {
  const a = fechaInicioYmd.value
  const b = fechaFinYmd.value
  if (!a || !b) return ''
  return `${formatFechaCorta(a)} → ${formatFechaCorta(b)}`
})
</script>

<template>
  <div class="space-y-2">
    <p v-if="rangoTexto && item" class="text-xs text-neutral-500 dark:text-neutral-400">
      Colocación estimada según plazo del simulador ({{ diasContrato }} días antes del último UVA):
      {{ rangoTexto }}
    </p>
    <div class="w-full" style="height: 26rem; min-height: 420px">
      <Chart
        v-if="definition"
        :definition="definition"
        aria-label="Historial de plazo fijo precancelable UVA"
        class="h-full w-full"
        :height="420"
        @render="paintLogos"
      />
      <div
        v-else
        class="w-full h-full min-h-[420px] flex items-center justify-center text-sm text-neutral-500"
      >
        <span v-if="!item">Seleccioná una entidad.</span>
        <span v-else-if="!uvaRows.length">Cargando datos UVA…</span>
        <span v-else>Sin datos suficientes de UVA para el rango.</span>
      </div>
    </div>
  </div>
</template>
