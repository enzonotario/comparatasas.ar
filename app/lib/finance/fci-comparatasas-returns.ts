export interface FciComparatasasRendimientos {
  ultimos7Dias: number | null
  unMes: number | null
  /** Variación diaria CNV en %; fallback de TNA si no hay 30D/7D. */
  variacionDiariaPct?: number | null
}

const DAYS_PER_YEAR = 365

type NominalTnaPeriod = '30D' | '7D' | '1D'

const NOMINAL_TNA_WINDOWS: Array<{
  period: NominalTnaPeriod
  token: string
  fallbackDays: number
  pick: (rendimientos: FciComparatasasRendimientos) => number | null | undefined
}> = [
  { period: '30D', token: 'r30D', fallbackDays: 30, pick: (r) => r.unMes },
  { period: '7D', token: 'r7D', fallbackDays: 7, pick: (r) => r.ultimos7Dias },
  { period: '1D', token: 'r1D', fallbackDays: 1, pick: (r) => r.variacionDiariaPct },
]

function finiteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

/**
 * CNV manda retorno de período; CAFCI legacy mandaba TNA ya anualizada.
 * Un 30D > 8% o un 7D > 10% no es un período CNV plausible.
 */
function looksLikePeriodReturn(value: number, windowDays: number) {
  const maxAbs = windowDays <= 1 ? 5 : windowDays <= 7 ? 10 : 8
  return Math.abs(value) <= maxAbs
}

function annualizePeriodReturn(periodPercent: number, windowDays: number) {
  if (!looksLikePeriodReturn(periodPercent, windowDays)) return periodPercent
  return (periodPercent * DAYS_PER_YEAR) / windowDays
}

export function estimateNominalTnaPercent(periodPercent: number, windowDays: number) {
  if (!Number.isFinite(periodPercent) || !(windowDays > 0)) return null
  return annualizePeriodReturn(periodPercent, windowDays)
}

export type NominalTnaEstimate = {
  value: number
  period: NominalTnaPeriod
  days: number
  formula: string
}

export function getNominalTnaEstimateFromRendimientos(
  rendimientos: FciComparatasasRendimientos,
  effectiveDays?: Partial<Record<NominalTnaPeriod, number | null>>,
): NominalTnaEstimate | null {
  for (const window of NOMINAL_TNA_WINDOWS) {
    const raw = window.pick(rendimientos)
    if (!finiteNumber(raw)) continue

    const override = effectiveDays?.[window.period]
    const days = override && override > 0 ? override : window.fallbackDays
    const value = annualizePeriodReturn(raw, days)
    if (!Number.isFinite(value)) continue

    return {
      value,
      period: window.period,
      days,
      formula: `Nominal ${window.period}: ${window.token} × 365/${days}`,
    }
  }

  return null
}

export function estimateNominalTnaFromReturnRows(
  rows: Array<{ period: string; value: number | null | undefined; effectiveDays: number | null }>,
): NominalTnaEstimate | null {
  const rendimientos: FciComparatasasRendimientos = {
    unMes: null,
    ultimos7Dias: null,
    variacionDiariaPct: null,
  }
  const effectiveDays: Partial<Record<NominalTnaPeriod, number | null>> = {}

  for (const row of rows) {
    if (row.period === '30D') {
      rendimientos.unMes = row.value ?? null
      effectiveDays['30D'] = row.effectiveDays
    } else if (row.period === '7D') {
      rendimientos.ultimos7Dias = row.value ?? null
      effectiveDays['7D'] = row.effectiveDays
    } else if (row.period === '1D') {
      rendimientos.variacionDiariaPct = row.value ?? null
      effectiveDays['1D'] = row.effectiveDays
    }
  }

  return getNominalTnaEstimateFromRendimientos(rendimientos, effectiveDays)
}

/** TNA nominal estimada (%) desde retornos CNV; mismo criterio para todos los tipos de renta. */
export function getComparatasasReturnPercent(
  rendimientos: FciComparatasasRendimientos,
  _tipoRenta?: string,
) {
  return getNominalTnaEstimateFromRendimientos(rendimientos)?.value ?? 0
}

/** Convierte la TNA nominal estimada (%) a decimal TNA/TEA. */
export function getComparatasasTnaAndTea(returnPercent: number, _tipoRenta?: string) {
  const returnRate = returnPercent / 100
  const tna = returnRate
  const tea = Math.pow(1 + returnRate / DAYS_PER_YEAR, DAYS_PER_YEAR) - 1

  return {
    tna: Number.isFinite(tna) ? tna : 0,
    tea: Number.isFinite(tea) ? tea : 0,
  }
}

export function hasComparatasasRendimientos(rendimientos: FciComparatasasRendimientos | null | undefined) {
  if (!rendimientos) return false

  return (
    rendimientos.variacionDiariaPct != null ||
    rendimientos.unMes != null ||
    rendimientos.ultimos7Dias != null
  )
}
