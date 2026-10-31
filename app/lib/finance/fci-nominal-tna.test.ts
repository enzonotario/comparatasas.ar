import { describe, expect, it } from 'vitest'
import { resolveFundNominalTnaEstimate } from './fci-nominal-tna'

describe('resolveFundNominalTnaEstimate', () => {
  it('uses rolling 7D effective days from VCP history when available', () => {
    const estimate = resolveFundNominalTnaEstimate(
      {
        fecha: '2026-08-18',
        rendimientos: {
          valorCuotaparte: 8427.618,
          variacionDiariaPct: 0.225,
          ultimos7Dias: 0.3818,
          unMes: 1.5393,
          noventaDias: null,
          cientoOchentaDias: null,
          enElAnio: null,
          doceMeses: null,
        },
      },
      {
        fondoId: '1',
        claseId: '1',
        nombre: 'Ualintec Ahorro Pesos - Clase A',
        fechaActualizacion: '2026-08-18',
        historico: [
          { fecha: '2026-08-11', valorCuotaparte: 8395.5, slug: 'x' },
          { fecha: '2026-08-18', valorCuotaparte: 8427.618, slug: 'x' },
        ],
      },
    )

    expect(estimate?.period).toBe('7D')
    expect(estimate?.days).toBe(7)
    // (8427.618 / 8395.5 - 1) * 100 ≈ 0.3826% → TNA ≈ 19.95%
    expect(estimate?.value).toBeCloseTo((0.3826 * 365) / 7, 1)
  })

  it('falls back to fixed 7D window without history', () => {
    const estimate = resolveFundNominalTnaEstimate({
      fecha: '2026-08-18',
      rendimientos: {
        valorCuotaparte: 8427.618,
        variacionDiariaPct: 0.225,
        ultimos7Dias: 0.3818,
        unMes: 1.5393,
        noventaDias: null,
        cientoOchentaDias: null,
        enElAnio: null,
        doceMeses: null,
      },
    })

    expect(estimate?.period).toBe('7D')
    expect(estimate?.days).toBe(7)
    expect(estimate?.value).toBeCloseTo((0.3818 * 365) / 7, 4)
  })

  it('uses diasUltimos7Dias from API when there is no local history', () => {
    const estimate = resolveFundNominalTnaEstimate({
      fecha: '2026-08-18',
      rendimientos: {
        valorCuotaparte: 8427.618,
        variacionDiariaPct: 0.225,
        ultimos7Dias: 0.3818,
        diasUltimos7Dias: 6,
        unMes: 1.5393,
        diasUnMes: 28,
        noventaDias: null,
        cientoOchentaDias: null,
        enElAnio: null,
        doceMeses: null,
      },
    })

    expect(estimate?.period).toBe('7D')
    expect(estimate?.days).toBe(6)
    expect(estimate?.value).toBeCloseTo((0.3818 * 365) / 6, 4)
  })

  it('falls back to daily when 7D is missing (no unMes for TNA)', () => {
    const estimate = resolveFundNominalTnaEstimate({
      fecha: '2026-08-18',
      rendimientos: {
        valorCuotaparte: 8427.618,
        variacionDiariaPct: 0.05,
        ultimos7Dias: null,
        unMes: 1.5393,
        noventaDias: null,
        cientoOchentaDias: null,
        enElAnio: null,
        doceMeses: null,
      },
    })

    expect(estimate?.period).toBe('1D')
    expect(estimate?.days).toBe(1)
    expect(estimate?.value).toBeCloseTo(18.25, 2)
  })
})
