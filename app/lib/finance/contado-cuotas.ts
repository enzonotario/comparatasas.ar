export interface CompareContadoCuotasOptions {
  cashPrice: number
  installmentAmount: number
  installmentCount: number
  /** Fracciones mensuales esperadas. Ej: 0.02 = 2% mensual */
  monthlyInflationRates?: ReadonlyArray<number>
}

export interface CompareContadoCuotasResult {
  totalFinanced: number
  recargoNominalFraction: number
  implicitMonthlyRate: number
  implicitTea: number
  presentValueAtInflation: number | null
  ahorroVsContado: number | null
  ahorroVsContadoFraction: number | null
  cuotaEquilibrio: number | null
}

export function presentValueOfLevelPaymentsAtRate(
  payment: number,
  periods: number,
  monthlyRate: number,
): number {
  if (!Number.isFinite(payment) || !Number.isFinite(periods) || periods < 1) return NaN
  if (Math.abs(monthlyRate) < 1e-12) return payment * periods
  return payment * ((1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate)
}

export function presentValueOfLevelPaymentsAtCurve(
  payment: number,
  monthlyRates: ReadonlyArray<number>,
  periods: number,
): number | null {
  if (!Number.isFinite(payment) || periods < 1 || monthlyRates.length === 0) return null

  const outRates = normalizeMonthlyRateCurve(monthlyRates, periods)
  let cumulativeFactor = 1
  let pv = 0

  for (const rate of outRates) {
    cumulativeFactor *= 1 + rate
    pv += payment / cumulativeFactor
  }

  return pv
}

export function sumDiscountFactorsFromCurve(
  monthlyRates: ReadonlyArray<number>,
  periods: number,
): number | null {
  if (periods < 1 || monthlyRates.length === 0) return null

  const outRates = normalizeMonthlyRateCurve(monthlyRates, periods)
  let cumulativeFactor = 1
  let discountSum = 0

  for (const rate of outRates) {
    cumulativeFactor *= 1 + rate
    discountSum += 1 / cumulativeFactor
  }

  return discountSum
}

export function normalizeMonthlyRateCurve(
  monthlyRates: ReadonlyArray<number>,
  periods: number,
): number[] {
  if (periods < 1 || monthlyRates.length === 0) return []

  const fallback = monthlyRates[monthlyRates.length - 1] ?? 0
  return Array.from({ length: periods }, (_, i) => monthlyRates[i] ?? fallback)
}

export function effectiveAnnualRateFromMonthly(monthlyRate: number): number {
  if (!Number.isFinite(monthlyRate) || monthlyRate <= -1) return NaN
  return Math.pow(1 + monthlyRate, 12) - 1
}

export function effectiveAnnualRateFromMonthlyCurve(
  monthlyRates: ReadonlyArray<number>,
): number | null {
  if (monthlyRates.length === 0) return null
  return monthlyRates.reduce((acc, rate) => acc * (1 + rate), 1) - 1
}

export function solveImplicitMonthlyRate(
  cashPrice: number,
  installmentAmount: number,
  installmentCount: number,
): number {
  if (
    !Number.isFinite(cashPrice) ||
    !Number.isFinite(installmentAmount) ||
    !Number.isFinite(installmentCount) ||
    cashPrice <= 0 ||
    installmentAmount <= 0 ||
    installmentCount < 1
  ) {
    return NaN
  }

  const valueAt = (rate: number) =>
    presentValueOfLevelPaymentsAtRate(installmentAmount, installmentCount, rate) - cashPrice

  let low = -0.999999999
  let high = 1

  while (valueAt(high) > 0 && high < 1_000_000) {
    high = high * 2 + 0.1
  }

  for (let i = 0; i < 160; i++) {
    const mid = (low + high) / 2
    if (valueAt(mid) > 0) {
      low = mid
    } else {
      high = mid
    }
  }

  return (low + high) / 2
}

export function impliedTeaFromRecargo(recargoPct: number, installmentCount: number): number {
  const cash = 100
  const total = cash * (1 + recargoPct / 100)
  const rate = solveImplicitMonthlyRate(cash, total / installmentCount, installmentCount)
  return effectiveAnnualRateFromMonthly(rate)
}

export function impliedTeaFromDiscount(discountPct: number, installmentCount: number): number {
  const total = 100
  const cash = total * (1 - discountPct / 100)
  const rate = solveImplicitMonthlyRate(cash, total / installmentCount, installmentCount)
  return effectiveAnnualRateFromMonthly(rate)
}

export function compareContadoVsCuotas(
  options: CompareContadoCuotasOptions,
): CompareContadoCuotasResult {
  const { cashPrice, installmentAmount, installmentCount, monthlyInflationRates = [] } = options

  const totalFinanced = installmentAmount * installmentCount
  const recargoNominalFraction = totalFinanced / cashPrice - 1
  const implicitMonthlyRate = solveImplicitMonthlyRate(
    cashPrice,
    installmentAmount,
    installmentCount,
  )
  const implicitTea = effectiveAnnualRateFromMonthly(implicitMonthlyRate)

  const presentValueAtInflation = presentValueOfLevelPaymentsAtCurve(
    installmentAmount,
    monthlyInflationRates,
    installmentCount,
  )

  const ahorroVsContado =
    presentValueAtInflation == null ? null : cashPrice - presentValueAtInflation
  const ahorroVsContadoFraction = ahorroVsContado == null ? null : ahorroVsContado / cashPrice

  const discountFactorSum = sumDiscountFactorsFromCurve(monthlyInflationRates, installmentCount)
  const cuotaEquilibrio = discountFactorSum == null ? null : cashPrice / discountFactorSum

  return {
    totalFinanced,
    recargoNominalFraction,
    implicitMonthlyRate,
    implicitTea,
    presentValueAtInflation,
    ahorroVsContado,
    ahorroVsContadoFraction,
    cuotaEquilibrio,
  }
}
