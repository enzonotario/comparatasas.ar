import type { FciFundHistoryItem } from '../composables/useFciFundDetails'
import { recomputeHistoryReturns } from './finance/fci-history-returns'
import { filterFundHistoryByPeriod, type FundHistoryPeriod } from './funds-detail'

export type FciCompareChartSeriesKey = 'retorno' | 'patrimonio' | 'vcp'

export interface FciCompareChartFundInput {
  key: string
  label: string
  color: string
  points: FciFundHistoryItem[]
}

export interface FciCompareChartSeriesPoint {
  fecha: string
  timestamp: number
  value: number
}

export interface FciCompareChartPreparedSeries {
  key: string
  label: string
  color: string
  points: FciCompareChartSeriesPoint[]
  /** Último valor de la serie en el período (retorno % / patrimonio / VCP indexado). */
  latestValue: number | null
}

function sortChronological(points: FciFundHistoryItem[]) {
  return [...points].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function readSeriesValue(
  point: FciFundHistoryItem & { retornoAcumulado?: number | null },
  series: FciCompareChartSeriesKey,
  firstVcp: number | null,
): number | null {
  switch (series) {
    case 'retorno':
      return point.retornoAcumulado ?? null
    case 'patrimonio':
      return point.patrimonio != null && Number.isFinite(point.patrimonio) ? point.patrimonio : null
    case 'vcp': {
      if (point.valorCuotaparte == null || !Number.isFinite(point.valorCuotaparte)) return null
      if (firstVcp == null || !(firstVcp > 0)) return null
      return Number(((point.valorCuotaparte / firstVcp) * 100).toFixed(4))
    }
    default:
      return null
  }
}

/**
 * Prepara series alineadas al período: recalcula retorno acumulado en la ventana
 * y, para VCP, indexa en base 100 al primer punto válido.
 */
export function prepareFciCompareChartSeries(
  funds: FciCompareChartFundInput[],
  period: FundHistoryPeriod,
  series: FciCompareChartSeriesKey,
): FciCompareChartPreparedSeries[] {
  return funds
    .map((fund) => {
      const chronological = sortChronological(fund.points)
      const windowPoints = filterFundHistoryByPeriod(chronological, period)
      const recomputed = recomputeHistoryReturns(windowPoints)
      const firstVcp =
        recomputed.find((point) => point.valorCuotaparte != null && point.valorCuotaparte > 0)
          ?.valorCuotaparte ?? null

      const points: FciCompareChartSeriesPoint[] = []
      for (const point of recomputed) {
        const value = readSeriesValue(point, series, firstVcp)
        if (value == null || !Number.isFinite(value)) continue
        const timestamp = Date.parse(`${point.fecha}T00:00:00.000Z`)
        if (!Number.isFinite(timestamp)) continue
        points.push({ fecha: point.fecha, timestamp, value })
      }

      return {
        key: fund.key,
        label: fund.label,
        color: fund.color,
        points,
        latestValue: points[points.length - 1]?.value ?? null,
      }
    })
    .filter((fund) => fund.points.length > 0)
}
