import { describe, expect, it } from 'vitest'
import {
  compareContadoVsCuotas,
  effectiveAnnualRateFromMonthlyCurve,
  impliedTeaFromDiscount,
  impliedTeaFromRecargo,
  presentValueOfLevelPaymentsAtCurve,
  presentValueOfLevelPaymentsAtRate,
  solveImplicitMonthlyRate,
} from './contado-cuotas'

describe('solveImplicitMonthlyRate', () => {
  it('returns ~0 when cash equals total financed', () => {
    const rate = solveImplicitMonthlyRate(100, 25, 4)
    expect(rate).toBeCloseTo(0, 6)
  })

  it('matches the reference heatmap logic for recargo 20% in 12 cuotas', () => {
    expect(impliedTeaFromRecargo(20, 12) * 100).toBeCloseTo(41.3, 1)
  })

  it('matches the reference heatmap logic for descuento 24% in 12 cuotas', () => {
    expect(impliedTeaFromDiscount(24, 12) * 100).toBeCloseTo(69.5, 1)
  })
})

describe('presentValue helpers', () => {
  it('present value at 0% monthly equals the sum of payments', () => {
    expect(presentValueOfLevelPaymentsAtRate(10, 12, 0)).toBeCloseTo(120, 8)
  })

  it('present value with curve discounts future installments', () => {
    const pv = presentValueOfLevelPaymentsAtCurve(100, [0.02], 3)
    expect(pv).toBeCloseTo(288.39, 2)
  })

  it('compounds the next 12 monthly REM values into an annual effective rate', () => {
    const annual = effectiveAnnualRateFromMonthlyCurve(Array(12).fill(0.02))
    expect((annual ?? 0) * 100).toBeCloseTo(26.82, 2)
  })
})

describe('compareContadoVsCuotas', () => {
  it('recommends cuotas when REM discounted PV is below cash', () => {
    const result = compareContadoVsCuotas({
      cashPrice: 100,
      installmentAmount: 10,
      installmentCount: 12,
      monthlyInflationRates: Array(12).fill(0.03),
    })

    expect(result.totalFinanced).toBe(120)
    expect(result.presentValueAtInflation).toBeLessThan(100)
    expect(result.ahorroVsContado).toBeGreaterThan(0)
    expect(result.cuotaEquilibrio).toBeGreaterThan(10)
  })
})
