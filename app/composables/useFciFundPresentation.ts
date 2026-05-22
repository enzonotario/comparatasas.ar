import { h, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type {
  FciFundDetail,
  FciFundHistory,
  FciFundHistoryItem,
} from '~/composables/useFciFundDetails'
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
    return [...(fundHistory.value?.historico ?? [])].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })
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

  const returnsRows = computed<ReturnRow[]>(() => [
    {
      period: '7D',
      effectiveDays: 7,
      value: fundDetail.value?.rendimientos?.ultimos7Dias,
    },
    {
      period: '30D',
      effectiveDays: 30,
      value: fundDetail.value?.rendimientos?.unMes,
    },
    {
      period: '90D',
      effectiveDays: 90,
      value: fundDetail.value?.rendimientos?.noventaDias,
    },
    {
      period: '180D',
      effectiveDays: 180,
      value: fundDetail.value?.rendimientos?.cientoOchentaDias,
    },
    {
      period: 'YTD',
      effectiveDays: effectiveDaysInYear.value,
      value: fundDetail.value?.rendimientos?.enElAnio,
    },
    {
      period: '1Y',
      effectiveDays: 365,
      value: fundDetail.value?.rendimientos?.doceMeses,
    },
  ])

  const returnsColumns: TableColumn<ReturnRow>[] = [
    {
      accessorKey: 'period',
      header: 'Período',
    },
    {
      accessorKey: 'value',
      header: () => h('div', { class: 'text-right' }, 'Rendimiento'),
      cell: ({ row }) =>
        h(
          'div',
          { class: `text-right font-medium ${metricTone(row.original.value)}` },
          formatPercentAuto(row.original.value),
        ),
    },
    {
      accessorKey: 'effectiveDays',
      header: () => h('div', { class: 'text-right' }, 'Días efectivos'),
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-right text-neutral-600 dark:text-neutral-300' },
          row.original.effectiveDays ?? '—',
        ),
    },
  ]

  const historyColumns: TableColumn<FciFundHistoryItem>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.fecha),
    },
    {
      accessorKey: 'valorCuotaparte',
      header: 'Valor cuotaparte',
      cell: ({ row }) =>
        h('div', { class: 'text-right font-mono' }, formatDecimal(row.original.valorCuotaparte)),
    },
    {
      accessorKey: 'retornoDiario',
      header: 'Retorno diario',
      cell: ({ row }) =>
        h(
          'div',
          { class: `text-right ${metricTone(row.original.retornoDiario)}` },
          formatPercentAuto(row.original.retornoDiario),
        ),
    },
    {
      accessorKey: 'retornoAcumulado',
      header: 'Retorno acumulado',
      cell: ({ row }) =>
        h(
          'div',
          { class: `text-right ${metricTone(row.original.retornoAcumulado)}` },
          formatPercentAuto(row.original.retornoAcumulado),
        ),
    },
    {
      accessorKey: 'patrimonio',
      header: 'Patrimonio',
      cell: ({ row }) =>
        h('div', { class: 'text-right' }, formatCompactNumber(row.original.patrimonio)),
    },
    {
      accessorKey: 'flujoEstimado',
      header: 'Flujo estimado',
      cell: ({ row }) =>
        h(
          'div',
          { class: `text-right ${metricTone(row.original.flujoEstimado)}` },
          formatCompactNumber(row.original.flujoEstimado),
        ),
    },
  ]

  return {
    historyRows,
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
