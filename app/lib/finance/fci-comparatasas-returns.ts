export interface FciComparatasasRendimientos {
  ultimos7Dias: number | null
  unMes: number | null
  /** Variación diaria CNV en %; fallback de TNA MM si no hay 30D/7D. */
  variacionDiariaPct?: number | null
}

const DAYS_PER_YEAR = 365

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
  return (periodPercent * DAYS_PER_YEAR) / windowDays
}

export type NominalTnaEstimate = {
  value: number
  period: '30D' | '7D' | '1D'
  days: number
  formula: string
}

export function estimateNominalTnaFromReturnRows(
  rows: Array<{ period: string; value: number | null | undefined; effectiveDays: number | null }>,
): NominalTnaEstimate | null {
  const windows = [
    { period: '30D' as const, token: 'r30D', fallbackDays: 30 },
    { period: '7D' as const, token: 'r7D', fallbackDays: 7 },
    { period: '1D' as const, token: 'r1D', fallbackDays: 1 },
  ]

  for (const window of windows) {
    const row = rows.find((item) => item.period === window.period)
    if (row?.value == null || !Number.isFinite(row.value)) continue

    const days = row.effectiveDays && row.effectiveDays > 0 ? row.effectiveDays : window.fallbackDays
    const value = estimateNominalTnaPercent(row.value, days)
    if (value == null) continue

    return {
      value,
      period: window.period,
      days,
      formula: `Nominal ${window.period}: ${window.token} × 365/${days}`,
    }
  }

  return null
}

export function getComparatasasReturnPercent(
  rendimientos: FciComparatasasRendimientos,
  tipoRenta: string,
) {
  if (tipoRenta === 'Mercado de Dinero') {
    // TNA nominal 30D: r30D × 365/30.
    if (finiteNumber(rendimientos.unMes)) {
      return annualizePeriodReturn(rendimientos.unMes, 30)
    }

    if (finiteNumber(rendimientos.ultimos7Dias)) {
      return annualizePeriodReturn(rendimientos.ultimos7Dias, 7)
    }

    if (finiteNumber(rendimientos.variacionDiariaPct)) {
      return annualizePeriodReturn(rendimientos.variacionDiariaPct, 1)
    }

    return 0
  }

  return rendimientos.unMes ?? 0
}

/** Convierte el rendimiento base (%) a TNA/TEA. */
export function getComparatasasTnaAndTea(returnPercent: number, tipoRenta?: string) {
  const returnRate = returnPercent / 100
  const tna = returnRate
  const tea =
    tipoRenta === 'Mercado de Dinero'
      ? Math.pow(1 + returnRate / DAYS_PER_YEAR, DAYS_PER_YEAR) - 1
      : Math.pow(1 + returnRate, 12) - 1

  return {
    tna: Number.isFinite(tna) ? tna : 0,
    tea: Number.isFinite(tea) ? tea : 0,
  }
}
