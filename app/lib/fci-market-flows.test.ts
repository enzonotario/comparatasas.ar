import { describe, expect, it } from 'vitest'
import {
  buildMarketFlowSnapshot,
  buildMarketHistorySnapshot,
  estimateFundFlow,
  parseFciSerieItem,
} from './fci-market-flows'

describe('estimateFundFlow', () => {
  it('isola el flujo del cambio de AUM por rendimiento', () => {
    // AUM 1000 → 1100 con VCP +5% ⇒ el extra 50 es flujo.
    expect(
      estimateFundFlow({ patrimonio: 1100, vcp: 105 }, { patrimonio: 1000, vcp: 100 }),
    ).toBeCloseTo(50)
  })

  it('devuelve null si falta VCP o patrimonio', () => {
    expect(
      estimateFundFlow({ patrimonio: 1100, vcp: null }, { patrimonio: 1000, vcp: 100 }),
    ).toBeNull()
  })
})

describe('buildMarketFlowSnapshot', () => {
  it('agrega flujo 1D por tipo y ranking de clases', () => {
    const snapshot = buildMarketFlowSnapshot(
      {
        mercadoDinero: {
          ultimo: [
            parseFciSerieItem({
              fondo: 'Alpha Pesos A',
              fecha: '2026-08-14',
              vcp: 105,
              patrimonio: 1100,
            })!,
            parseFciSerieItem({
              fondo: 'Beta Pesos A',
              fecha: '2026-08-14',
              vcp: 100,
              patrimonio: 800,
            })!,
          ],
          penultimo: [
            parseFciSerieItem({
              fondo: 'Alpha Pesos A',
              fecha: '2026-08-13',
              vcp: 100,
              patrimonio: 1000,
            })!,
            parseFciSerieItem({
              fondo: 'Beta Pesos A',
              fecha: '2026-08-13',
              vcp: 100,
              patrimonio: 900,
            })!,
          ],
        },
      },
      5,
    )

    expect(snapshot.to).toBe('2026-08-14')
    expect(snapshot.from).toBe('2026-08-13')
    expect(snapshot.patrimonio).toBe(1900)
    expect(snapshot.flujoEstimado).toBeCloseTo(-50)
    expect(snapshot.byType[0]?.flujoEstimado).toBeCloseTo(-50)
    expect(snapshot.inflows[0]?.name).toBe('Alpha Pesos A')
    expect(snapshot.outflows[0]?.name).toBe('Beta Pesos A')
  })
})

describe('buildMarketHistorySnapshot', () => {
  it('suma AUM y flujo por fecha y tipo', () => {
    const history = buildMarketHistorySnapshot({
      alpha: [
        {
          fecha: '2026-08-13',
          categoriaKey: 'mercadoDinero',
          patrimonio: 1000,
          flujoEstimado: 10,
        },
        {
          fecha: '2026-08-14',
          categoriaKey: 'mercadoDinero',
          patrimonio: 1100,
          flujoEstimado: 50,
        },
      ],
      gamma: [
        {
          fecha: '2026-08-14',
          categoria: 'Renta Fija',
          patrimonio: 500,
          flujoEstimado: -20,
        },
      ],
    })

    expect(history.puntos).toHaveLength(2)
    expect(history.puntos[0]?.patrimonio).toBe(1000)
    expect(history.puntos[1]?.patrimonio).toBe(1600)
    expect(history.puntos[1]?.flujoEstimado).toBe(30)
    expect(history.puntos[1]?.byType.rentaFija?.patrimonio).toBe(500)
  })
})
