<script setup lang="ts">
import type { SeriesLineOptions } from 'highcharts'
import type { PlazoFijoPrecancelableItem } from '~/composables/usePlazosFijosPrecancelables'
import { formatCurrencyFull, useChartTheme } from '~/composables/useChartConfig'
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

const colorMode = useColorMode()
const { textColor, gridLineColor } = useChartTheme()

const tooltipBackground = computed(() => (colorMode.value === 'dark' ? '#171717' : '#ffffff'))

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

function ymdToUtcMs(ymd: string): number {
  const [y = 1970, m = 1, d = 1] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function utcMsToYmd(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

const chartOptions = computed(() => {
  const pts = historyPoints.value
  const entidad = props.item?.institution ?? ''
  const inicio = fechaInicioYmd.value
  const fin = fechaFinYmd.value
  if (!pts.length || !props.item || !inicio || !fin) return null

  const dataVencimiento = pts.map(
    (p) => [ymdToUtcMs(p.fechaYmd), p.montoFinalUva] as [number, number],
  )
  const tienePrec = pts[0]?.montoFinalPrecancelacion != null
  const dataPrec = tienePrec
    ? pts.map((p) => [ymdToUtcMs(p.fechaYmd), p.montoFinalPrecancelacion ?? 0] as [number, number])
    : []

  const nameVencimiento = entidad ? `UVA + TNA adic. (${entidad})` : 'UVA + TNA adicional'
  const showMarkers = pts.length <= 90

  const series: SeriesLineOptions[] = [
    {
      type: 'line',
      name: nameVencimiento,
      data: dataVencimiento,
      color: '#3b82f6',
      lineWidth: 2.5,
      marker: {
        enabled: showMarkers,
        radius: 3,
        symbol: 'circle',
      },
    },
  ]

  if (tienePrec && dataPrec.length) {
    series.push({
      type: 'line',
      name: 'Precancelación (solo TNA)',
      data: dataPrec,
      color: '#f59e0b',
      lineWidth: 2.5,
      marker: {
        enabled: showMarkers,
        radius: 3,
        symbol: 'square',
      },
    })
  }

  const capitalInicial = props.montoSimulacion

  const todasY = pts.flatMap((p) =>
    p.montoFinalPrecancelacion != null
      ? [p.montoFinalUva, p.montoFinalPrecancelacion]
      : [p.montoFinalUva],
  )
  const minY = Math.min(...todasY)
  const maxY = Math.max(...todasY)
  const span = maxY - minY
  const pad = span > 0 ? span * 0.08 : maxY * 0.02

  return {
    chart: {
      backgroundColor: 'transparent',
      height: 420,
      spacing: [12, 12, 16, 12],
    },
    title: { text: '' },
    accessibility: {
      enabled: false,
    },
    time: {
      useUTC: true,
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Fecha',
        style: { color: textColor.value },
      },
      labels: {
        style: { color: textColor.value },
      },
      gridLineWidth: 0,
      lineColor: gridLineColor.value,
      tickColor: gridLineColor.value,
    },
    yAxis: {
      title: {
        text: 'Monto (ARS)',
        style: { color: textColor.value },
      },
      min: minY - pad,
      max: maxY + pad,
      labels: {
        style: { color: textColor.value },
        formatter(): string {
          return formatCurrencyFull(Number((this as unknown as { value: number }).value))
        },
      },
      gridLineColor: gridLineColor.value,
      lineColor: gridLineColor.value,
    },
    tooltip: {
      shared: true,
      outside: true,
      useHTML: true,
      xDateFormat: '%d/%m/%Y',
      backgroundColor: tooltipBackground.value,
      borderColor: gridLineColor.value,
      borderWidth: 1,
      padding: 12,
      style: {
        color: textColor.value,
        zIndex: 10050,
      },
      formatter(): string {
        const ctx = this as unknown as {
          x: number
          points?: Array<{ series: { name: string }; y: number }>
        }
        const t = new Date(ctx.x)
        const fechaStr = new Intl.DateTimeFormat('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(t)
        const xMs = ctx.x
        const p = pts.find((row) => row.fechaYmd === utcMsToYmd(xMs))
        const inst = entidad
        let html = `<div style="font-family:inherit"><b>${inst}</b><br/><span style="opacity:.85">${fechaStr}</span><br/>`
        if (p) {
          const pctUva = pctSobreCapital(p.montoFinalUva, capitalInicial)
          html += `<span style="color:#3b82f6">●</span> UVA + TNA adic.: <b>${formatCurrencyFull(p.montoFinalUva)}</b>`
          if (pctUva) html += ` <span style="opacity:.9">(${pctUva} sobre capital inicial)</span>`
          html += '<br/>'
          if (p.montoFinalPrecancelacion != null) {
            const pctPrec = pctSobreCapital(p.montoFinalPrecancelacion, capitalInicial)
            html += `<span style="color:#f59e0b">■</span> Solo TNA prec.: <b>${formatCurrencyFull(p.montoFinalPrecancelacion)}</b>`
            if (pctPrec)
              html += ` <span style="opacity:.9">(${pctPrec} sobre capital inicial)</span>`
            html += '<br/>'
          }
          html += `<span style="opacity:.85">Días desde colocación: ${p.diasDesdeInicio}</span>`
        } else if (ctx.points?.length) {
          for (const pt of ctx.points) {
            const pct = pctSobreCapital(pt.y, capitalInicial)
            html += `${pt.series.name}: <b>${formatCurrencyFull(pt.y)}</b>`
            if (pct) html += ` <span style="opacity:.9">(${pct} sobre capital inicial)</span>`
            html += '<br/>'
          }
        }
        html += '</div>'
        return html
      },
    },
    plotOptions: {
      line: {
        animation: { duration: 400 },
      },
    },
    series,
    legend: {
      itemStyle: { color: textColor.value },
      itemHoverStyle: { color: textColor.value },
    },
    credits: { enabled: false },
  }
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
    <div class="precancelable-uva-history-chart w-full" style="height: 26rem; min-height: 420px">
      <highchart v-if="chartOptions" :options="chartOptions" class="w-full h-full" />
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

<style scoped>
.precancelable-uva-history-chart :deep(.highcharts-tooltip) {
  z-index: 10050;
}
</style>
