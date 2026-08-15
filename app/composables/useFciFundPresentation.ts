import { h, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  FciFundDetail,
  FciFundHistory,
  FciFundHistoryItem,
} from '~/composables/useFciFundDetails'
import {
  computeRendimientosFromHistory,
  recomputeHistoryReturns,
  sanitizePeriodReturnPercent,
} from '~/lib/finance/fci-history-returns'
import {
  formatCompactNumber,
  formatDate,
  formatDecimal,
  formatPercentAuto,
  metricTone,
} from '~/lib/fci-fund-formatters'

export type ReturnRow = {
  period: string
  effectiveDays: number | null
  value: number | null | undefined
}

export function useFciFundPresentation(
  fundDetailSource: MaybeRefOrGetter<FciFundDetail | null | undefined>,
  fundHistorySource: MaybeRefOrGetter<FciFundHistory | null | undefined>,
) {
  const fundDetail = computed(() => toValue(fundDetailSource) ?? null)
  const fundHistory = computed(() => toValue(fundHistorySource) ?? null)

  const historyRows = computed(() => {
    const recomputed = recomputeHistoryReturns(fundHistory.value?.historico ?? [])
    return [...recomputed].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })
  })

  /** Serie limpia en orden cronológico (para charts). */
  const historyChronological = computed(() => {
    return [...historyRows.value].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    )
  })

  const latestHistoryPoint = computed(() => historyRows.value[0] ?? null)
  const oldestHistoryPoint = computed(() => historyRows.value[historyRows.value.length - 1] ?? null)

  const compositionRows = computed(() => {
    return [...(fundDetail.value?.composicionCartera ?? [])]
      .filter((item) => item.nombre || item.porcentaje != null)
      .sort((a, b) => (b.porcentaje ?? -Infinity) - (a.porcentaje ?? -Infinity))
  })

  const maxCompositionPercentage = computed(() => {
    return compositionRows.value.reduce((max, item) => {
      return Math.max(max, item.porcentaje ?? 0)
    }, 0)
  })

  const feeRows = computed(() => {
    const fees = fundDetail.value?.honorarios
    if (!fees) return []

    return [
      ['Honorario gerente', fees.honorarioGerente],
      ['Honorario depositaria', fees.honorarioDepositaria],
      ['Comisión de ingreso', fees.comisionIngreso],
      ['Comisión de egreso', fees.comisionEgreso],
      ['Comisión de transferencia', fees.comisionTransferencia],
      ['Gastos ordinarios', fees.gastosOrdinariosGestion],
      ['Comisión de éxito', fees.comisionExito],
      ['Otros', fees.otros],
    ]
  })

  const effectiveDaysInYear = computed(() => {
    const sourceDate = fundDetail.value?.fecha
    if (!sourceDate) return null

    const date = new Date(`${sourceDate}T00:00:00`)
    if (Number.isNaN(date.getTime())) return null

    const yearStart = new Date(date.getFullYear(), 0, 1)
    const diffMs = date.getTime() - yearStart.getTime()
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
  })

  const fallbackRendimientos = computed(() => {
    const detail = fundDetail.value
    const history = fundHistory.value?.historico
    if (!detail?.fecha || detail.rendimientos?.valorCuotaparte == null || !history?.length) {
      return null
    }

    return computeRendimientosFromHistory({
      fecha: detail.fecha,
      valorCuotaparte: detail.rendimientos.valorCuotaparte,
      variacionDiariaPct: detail.rendimientos.variacionDiariaPct,
      history,
    })
  })

  const returnsRows = computed<ReturnRow[]>(() => {
    const api = fundDetail.value?.rendimientos
    const fallback = fallbackRendimientos.value

    // Preferir retornos de período publicados por CNV; historial solo como fallback.
    const dailyValue = sanitizePeriodReturnPercent(api?.variacionDiariaPct)
    const sevenValue =
      sanitizePeriodReturnPercent(api?.ultimos7Dias) ??
      sanitizePeriodReturnPercent(fallback?.ultimos7Dias)
    const monthValue =
      sanitizePeriodReturnPercent(api?.unMes) ?? sanitizePeriodReturnPercent(fallback?.unMes)
    const ytdValue =
      sanitizePeriodReturnPercent(api?.enElAnio) ??
      sanitizePeriodReturnPercent(fallback?.enElAnio)
    const yearValue =
      sanitizePeriodReturnPercent(api?.doceMeses) ??
      sanitizePeriodReturnPercent(fallback?.doceMeses)

    return [
      {
        period: '1D',
        effectiveDays: dailyValue == null ? null : 1,
        value: dailyValue,
      },
      {
        period: '7D',
        effectiveDays: fallback?.sevenDays ?? (sevenValue == null ? null : 7),
        value: sevenValue,
      },
      {
        period: '30D',
        effectiveDays: fallback?.thirtyDays ?? (monthValue == null ? null : 30),
        value: monthValue,
      },
      {
        period: '90D',
        effectiveDays: 90,
        value: sanitizePeriodReturnPercent(api?.noventaDias),
      },
      {
        period: '180D',
        effectiveDays: 180,
        value: sanitizePeriodReturnPercent(api?.cientoOchentaDias),
      },
      {
        period: 'YTD',
        effectiveDays: effectiveDaysInYear.value,
        value: ytdValue,
      },
      {
        period: '1Y',
        effectiveDays: 365,
        value: yearValue,
      },
    ]
  })

  const returnsColumns: TableColumn<ReturnRow>[] = [
    {
      accessorKey: 'period',
      header: 'Período',
      meta: {
        class: {
          th: 'w-[7rem]',
          td: 'w-[7rem] font-medium',
        },
      },
    },
    {
      accessorKey: 'value',
      header: () => h('div', { class: 'text-right' }, 'Rendimiento'),
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          { class: `text-right tabular-nums font-medium ${metricTone(row.original.value)}` },
          formatPercentAuto(row.original.value),
        ),
    },
    {
      accessorKey: 'effectiveDays',
      header: () => h('div', { class: 'text-right' }, 'Días efectivos'),
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-right tabular-nums text-neutral-600 dark:text-neutral-300' },
          row.original.effectiveDays ?? '—',
        ),
    },
  ]

  const historyColumns: TableColumn<FciFundHistoryItem>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      meta: {
        class: {
          th: 'whitespace-nowrap',
          td: 'whitespace-nowrap',
        },
      },
      cell: ({ row }) => formatDate(row.original.fecha),
    },
    {
      accessorKey: 'valorCuotaparte',
      header: () => h('div', { class: 'text-right' }, 'VCP'),
      meta: {
        class: {
          th: 'text-right whitespace-nowrap',
          td: 'text-right whitespace-nowrap',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-right font-mono tabular-nums' },
          formatDecimal(row.original.valorCuotaparte),
        ),
    },
    {
      accessorKey: 'retornoDiario',
      header: () => h('div', { class: 'text-right' }, 'Ret. diario'),
      meta: {
        class: {
          th: 'text-right whitespace-nowrap',
          td: 'text-right whitespace-nowrap',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          {
            class: `text-right tabular-nums ${metricTone(row.original.retornoDiario)}`,
          },
          formatPercentAuto(row.original.retornoDiario),
        ),
    },
    {
      accessorKey: 'retornoAcumulado',
      header: () => h('div', { class: 'text-right' }, 'Ret. acum.'),
      meta: {
        class: {
          th: 'text-right whitespace-nowrap',
          td: 'text-right whitespace-nowrap',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          {
            class: `text-right tabular-nums ${metricTone(row.original.retornoAcumulado)}`,
          },
          formatPercentAuto(row.original.retornoAcumulado),
        ),
    },
    {
      accessorKey: 'patrimonio',
      header: () => h('div', { class: 'text-right' }, 'Patrimonio'),
      meta: {
        class: {
          th: 'text-right whitespace-nowrap',
          td: 'text-right whitespace-nowrap',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-right tabular-nums' },
          formatCompactNumber(row.original.patrimonio),
        ),
    },
    {
      accessorKey: 'flujoEstimado',
      header: () => h('div', { class: 'text-right' }, 'Flujo'),
      meta: {
        class: {
          th: 'text-right whitespace-nowrap',
          td: 'text-right whitespace-nowrap',
        },
      },
      cell: ({ row }) =>
        h(
          'div',
          {
            class: `text-right tabular-nums ${metricTone(row.original.flujoEstimado)}`,
          },
          formatCompactNumber(row.original.flujoEstimado),
        ),
    },
  ]

  return {
    historyRows,
    historyChronological,
    latestHistoryPoint,
    oldestHistoryPoint,
    compositionRows,
    maxCompositionPercentage,
    feeRows,
    returnsRows,
    returnsColumns,
    historyColumns,
  }
}
