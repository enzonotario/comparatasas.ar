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
import { resolveFundNominalTnaEstimate } from '~/lib/finance/fci-nominal-tna'
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

    // 1D/7D/YTD/1Y de CNV suelen coincidir con rolling. unMes CNV = vs fin de mes previo
    // (no 30D). noventa/cientoOchenta CNV suelen venir anualizados — no usarlos como período.
    const dailyValue = sanitizePeriodReturnPercent(api?.variacionDiariaPct)
    const sevenValue =
      sanitizePeriodReturnPercent(fallback?.ultimos7Dias) ??
      sanitizePeriodReturnPercent(api?.ultimos7Dias)
    const monthValue =
      sanitizePeriodReturnPercent(fallback?.unMes) ?? sanitizePeriodReturnPercent(api?.unMes)
    const ninetyValue = sanitizePeriodReturnPercent(fallback?.noventaDias)
    const oneEightyValue = sanitizePeriodReturnPercent(fallback?.cientoOchentaDias)
    const ytdValue =
      sanitizePeriodReturnPercent(fallback?.enElAnio) ??
      sanitizePeriodReturnPercent(api?.enElAnio)
    const yearValue =
      sanitizePeriodReturnPercent(fallback?.doceMeses) ??
      sanitizePeriodReturnPercent(api?.doceMeses)

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
        effectiveDays: fallback?.ninetyDays ?? (ninetyValue == null ? null : 90),
        value: ninetyValue,
      },
      {
        period: '180D',
        effectiveDays: fallback?.oneEightyDays ?? (oneEightyValue == null ? null : 180),
        value: oneEightyValue,
      },
      {
        period: 'YTD',
        effectiveDays: fallback?.ytdDays ?? effectiveDaysInYear.value,
        value: ytdValue,
      },
      {
        period: '1Y',
        effectiveDays: fallback?.twelveMonthDays ?? (yearValue == null ? null : 365),
        value: yearValue,
      },
    ]
  })

  const return30d = computed(
    () => returnsRows.value.find((row) => row.period === '30D')?.value ?? null,
  )

  const nominalTnaEstimate = computed(() => {
    const detail = fundDetail.value
    if (!detail) return null
    return resolveFundNominalTnaEstimate(detail, fundHistory.value)
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
    return30d,
    nominalTnaEstimate,
    returnsColumns,
    historyColumns,
  }
}
