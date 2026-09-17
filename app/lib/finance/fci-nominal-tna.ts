import type { FciFundDetail, FciFundHistory } from '../../composables/useFciFundDetails'
import { computeRendimientosFromHistory } from './fci-history-returns'
import {
  getComparatasasTnaAndTea,
  getNominalTnaEstimateFromRendimientos,
  type NominalTnaEstimate,
} from './fci-comparatasas-returns'

export function resolveFundNominalTnaEstimate(
  fund: Pick<FciFundDetail, 'fecha' | 'rendimientos'>,
  history?: FciFundHistory | null,
): NominalTnaEstimate | null {
  const rendimientos = fund.rendimientos
  if (!rendimientos) return null

  if (fund.fecha && rendimientos.valorCuotaparte != null && history?.historico?.length) {
    const rolling = computeRendimientosFromHistory({
      fecha: fund.fecha,
      valorCuotaparte: rendimientos.valorCuotaparte,
      variacionDiariaPct: rendimientos.variacionDiariaPct,
      history: history.historico,
    })

    return getNominalTnaEstimateFromRendimientos(
      {
        unMes: rolling.unMes,
        ultimos7Dias: rolling.ultimos7Dias,
        variacionDiariaPct: rendimientos.variacionDiariaPct ?? null,
      },
      {
        '30D': rolling.thirtyDays,
        '7D': rolling.sevenDays,
        '1D': 1,
      },
    )
  }

  return getNominalTnaEstimateFromRendimientos(rendimientos)
}

export function nominalTnaRatesFromEstimate(estimate: NominalTnaEstimate | null | undefined) {
  if (!estimate) {
    return { tna: null as number | null, tea: null as number | null }
  }

  const rates = getComparatasasTnaAndTea(estimate.value)
  return { tna: rates.tna, tea: rates.tea }
}
