import { describe, expect, it } from 'vitest'
import {
  allocateInitialCashAcrossOptions,
  growthFactorForNominalAnnualRate,
  simulateInvestmentCarry,
} from './contado-cuotas-carry'

describe('allocateInitialCashAcrossOptions', () => {
  it('fills higher-rate options first and respects caps', () => {
    const allocations = allocateInitialCashAcrossOptions(1_000, [
      { id: 'a', label: 'A', tna: 0.3, tope: 300 },
      { id: 'b', label: 'B', tna: 0.5, tope: 200 },
      { id: 'c', label: 'C', tna: 0.1, tope: null },
    ])

    expect(allocations.map((item) => [item.id, item.initialAmount])).toEqual([
      ['b', 200],
      ['a', 300],
      ['c', 500],
    ])
  })

  it('creates a cash reserve bucket if selected caps do not cover the cash', () => {
    const allocations = allocateInitialCashAcrossOptions(1_000, [
      { id: 'a', label: 'A', tna: 0.3, tope: 300 },
    ])

    expect(allocations[0]?.initialAmount).toBe(300)
    expect(allocations[1]?.id).toBe('cash-reserve')
    expect(allocations[1]?.initialAmount).toBe(700)
  })
})

describe('growthFactorForNominalAnnualRate', () => {
  it('matches 30-day compounding at nominal annual rate', () => {
    expect(growthFactorForNominalAnnualRate(0.36, 30)).toBeCloseTo(Math.pow(1 + 0.36 / 365, 30), 10)
  })
})

describe('simulateInvestmentCarry', () => {
  it('shows nominal loss with zero-rate cash reserve versus financing', () => {
    const result = simulateInvestmentCarry({
      initialCash: 100,
      installmentAmount: 10,
      installmentCount: 12,
      selectedOptions: [{ id: 'cash', label: 'Cash', tna: 0, tope: null }],
    })

    expect(result.netOutcome).toBeCloseTo(-20, 8)
    expect(result.cumulativeShortfall).toBeCloseTo(20, 8)
  })

  it('keeps positive leftover if return is sufficiently high', () => {
    const result = simulateInvestmentCarry({
      initialCash: 100,
      installmentAmount: 10,
      installmentCount: 10,
      selectedOptions: [{ id: 'carry', label: 'Carry', tna: 1.2, tope: null }],
    })

    expect(result.netOutcome).toBeGreaterThan(0)
    expect(result.totalInterestEarned).toBeGreaterThan(0)
  })
})
