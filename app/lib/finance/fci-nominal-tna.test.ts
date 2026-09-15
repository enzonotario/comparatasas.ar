import { describe, expect, it } from 'vitest'
import { resolveFundNominalTnaEstimate } from './fci-nominal-tna'

describe('resolveFundNominalTnaEstimate', () => {
  it('uses rolling 30D effective days from VCP history when available', () => {
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
          { fecha: '2026-07-20', valorCuotaparte: 8299.9, slug: 'x' },
          { fecha: '2026-08-18', valorCuotaparte: 8427.618, slug: 'x' },
        ],
      },
    )

    expect(estimate?.days).toBe(29)
    expect(estimate?.value).toBeCloseTo(19.37, 2)
  })

  it('falls back to fixed 30D window without history', () => {
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

    expect(estimate?.days).toBe(30)
    expect(estimate?.value).toBeCloseTo(18.73, 2)
  })

  it('uses diasUnMes from API when there is no local history', () => {
    const estimate = resolveFundNominalTnaEstimate({
      fecha: '2026-08-18',
      rendimientos: {
        valorCuotaparte: 8427.618,
        variacionDiariaPct: 0.225,
        ultimos7Dias: 0.3818,
        diasUltimos7Dias: 7,
        unMes: 1.5393,
        diasUnMes: 28,
        noventaDias: null,
        cientoOchentaDias: null,
        enElAnio: null,
        doceMeses: null,
      },
    })

    expect(estimate?.days).toBe(28)
    expect(estimate?.value).toBeCloseTo((1.5393 * 365) / 28, 4)
  })
})
