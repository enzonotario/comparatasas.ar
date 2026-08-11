import { describe, expect, it } from 'vitest'
import {
  bestRatesFromTasasPorPlazo,
  classifyCuotaIngreso,
  compareCftVsRem,
  frenchAmortizationPayment,
  ingresoRequeridoParaCuota,
  monthlyRateFromTeaPercent,
  monthlyRateFromTnaPercent,
  parseAfectacionIngresosPercent,
  pickTasasPorPlazo,
  projectCuotaIngresoByYear,
  simulatePrestamoPersonal,
} from './prestamo-personal'

describe('parseAfectacionIngresosPercent', () => {
  it('parses percent strings', () => {
    expect(parseAfectacionIngresosPercent('30%')).toBe(30)
    expect(parseAfectacionIngresosPercent('35')).toBe(35)
  })

  it('returns null for empty values', () => {
    expect(parseAfectacionIngresosPercent(null)).toBeNull()
    expect(parseAfectacionIngresosPercent('')).toBeNull()
  })
})

describe('frenchAmortizationPayment', () => {
  it('splits principal evenly at 0% rate', () => {
    expect(frenchAmortizationPayment(120_000, 0, 12)).toBeCloseTo(10_000, 6)
  })

  it('matches sistema francés for a known TNA example', () => {
    // $1.000.000 a TNA 60% en 12 meses → r = 0.05
    const cuota = frenchAmortizationPayment(1_000_000, monthlyRateFromTnaPercent(60), 12)
    expect(cuota).toBeCloseTo(112_825.41, 1)
  })
})

describe('monthlyRateFromTeaPercent', () => {
  it('converts TEA 0% to 0 monthly', () => {
    expect(monthlyRateFromTeaPercent(0)).toBeCloseTo(0, 12)
  })

  it('compounds back to the original TEA', () => {
    const monthly = monthlyRateFromTeaPercent(100)
    expect((Math.pow(1 + monthly, 12) - 1) * 100).toBeCloseTo(100, 8)
  })
})

describe('simulatePrestamoPersonal', () => {
  it('computes cuota, total and income cap', () => {
    const result = simulatePrestamoPersonal({
      amount: 1_000_000,
      months: 12,
      tnaPercent: 60,
      cftTeaPercent: 100,
      afectacionIngresos: '30%',
      income: 400_000,
    })

    expect(result.cuota).toBeCloseTo(112_825.41, 1)
    expect(result.total).toBeCloseTo(1_353_904.92, 0)
    expect(result.maxCuotaByIncome).toBeCloseTo(120_000, 6)
    expect(result.exceedsIncomeCap).toBe(false)
    expect(result.cuotaCft).not.toBeNull()
  })

  it('flags income cap when cuota exceeds afectación', () => {
    const result = simulatePrestamoPersonal({
      amount: 1_000_000,
      months: 12,
      tnaPercent: 60,
      afectacionIngresos: '30%',
      income: 200_000,
    })

    expect(result.exceedsIncomeCap).toBe(true)
  })

  it('marks plazo ejemplo mismatch', () => {
    const result = simulatePrestamoPersonal({
      amount: 500_000,
      months: 24,
      tnaPercent: 70,
      plazoMesesEjemplo: 60,
    })

    expect(result.plazoDifiereDeEjemplo).toBe(true)
    expect(result.plazoEjemplo).toBe(60)
    expect(result.plazoFueraDeRango).toBe(false)
  })

  it('uses tasasPorPlazo band when available', () => {
    const result = simulatePrestamoPersonal({
      amount: 1_000_000,
      months: 12,
      tnaPercent: 79,
      cftTeaPercent: 150.86,
      plazoMesesEjemplo: 60,
      tasasPorPlazo: [
        { plazoMinMeses: 1, plazoMaxMeses: 12, tna: 61, cftTea: 104.68 },
        { plazoMinMeses: 49, plazoMaxMeses: 60, tna: 79, cftTea: 150.86 },
      ],
    })

    expect(result.plazoFueraDeRango).toBe(false)
    expect(result.plazoDifiereDeEjemplo).toBe(false)
    expect(result.cuota).toBeCloseTo(
      frenchAmortizationPayment(1_000_000, monthlyRateFromTnaPercent(61), 12),
      1,
    )
  })

  it('flags plazoFueraDeRango when no band matches', () => {
    const result = simulatePrestamoPersonal({
      amount: 500_000,
      months: 24,
      tnaPercent: 66,
      tasasPorPlazo: [{ plazoMinMeses: 1, plazoMaxMeses: 12, tna: 66, cftTea: 116.66 }],
    })

    expect(result.plazoFueraDeRango).toBe(true)
    expect(result.cuota).toBeNull()
    expect(result.cuotaCft).toBeNull()
  })

  it('returns null cuota without TNA', () => {
    const result = simulatePrestamoPersonal({
      amount: 500_000,
      months: 24,
      tnaPercent: null,
    })

    expect(result.cuota).toBeNull()
    expect(result.total).toBeNull()
  })
})

describe('pickTasasPorPlazo', () => {
  it('finds containing band', () => {
    const band = pickTasasPorPlazo(
      [
        { plazoMinMeses: 1, plazoMaxMeses: 12, tna: 61 },
        { plazoMinMeses: 13, plazoMaxMeses: 18, tna: 63 },
      ],
      15,
    )
    expect(band?.tna).toBe(63)
  })
})

describe('bestRatesFromTasasPorPlazo', () => {
  it('returns the minimum rates across bands', () => {
    const best = bestRatesFromTasasPorPlazo([
      { plazoMinMeses: 1, plazoMaxMeses: 12, tna: 61, tea: 81.3, cftTea: 104.68 },
      { plazoMinMeses: 49, plazoMaxMeses: 60, tna: 79, tea: 114.92, cftTea: 150.86 },
    ])

    expect(best).toEqual({
      tna: 61,
      tea: 81.3,
      cftTea: 104.68,
    })
  })

  it('returns null for empty lists', () => {
    expect(bestRatesFromTasasPorPlazo([])).toBeNull()
    expect(bestRatesFromTasasPorPlazo(null)).toBeNull()
  })
})

describe('cuota/ingreso helpers', () => {
  it('classifies risk bands', () => {
    expect(classifyCuotaIngreso(10)).toBe('optimo')
    expect(classifyCuotaIngreso(25)).toBe('aceptable')
    expect(classifyCuotaIngreso(35)).toBe('alerta')
    expect(classifyCuotaIngreso(45)).toBe('riesgo')
  })

  it('computes ingreso requerido at 30%', () => {
    expect(ingresoRequeridoParaCuota(300_000)).toBeCloseTo(1_000_000, 6)
  })

  it('projects years with salary increases', () => {
    const rows = projectCuotaIngresoByYear({
      months: 24,
      cuota: 100_000,
      income: 1_000_000,
      aumentoAnualPercent: 0,
      frecuencia: 'anual',
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]!.ratioPercent).toBeCloseTo(10, 6)
    expect(rows[0]!.risk).toBe('optimo')
  })
})

describe('compareCftVsRem', () => {
  it('matches Profit-style multiple for CFT 115 vs REM 21.8', () => {
    const result = compareCftVsRem(115, 21.8)
    expect(result).not.toBeNull()
    expect(result!.multiple).toBeCloseTo(5.275, 2)
    expect(result!.risk).toBe('extremo')
  })

  it('returns null for invalid rem', () => {
    expect(compareCftVsRem(100, 0)).toBeNull()
  })
})
