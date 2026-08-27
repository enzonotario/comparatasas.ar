import { describe, expect, it } from 'vitest'
import {
  daysBetweenDateOnly,
  isPlazoCoherentWithVencimiento,
  mapCaucionItems,
  type CaucionApiItem,
} from './useCauciones'

const sample: CaucionApiItem[] = [
  {
    plazo: 3,
    montoContado: 6_775_017_746_682,
    tasaActual: 18.5,
    tasaMinDia: 18.5,
    tasaMaxDia: 18.5,
    fechaOperacion: '2026-08-22',
    fechaActualizacion: '2026-08-22T19:20:23.874Z',
    fechaVencimiento: '2026-08-24T00:00:00',
  },
  {
    plazo: 162,
    montoContado: 1_148_660_851,
    tasaActual: 25.3,
    tasaMinDia: 25.3,
    tasaMaxDia: 25.3,
    fechaOperacion: '2026-08-22',
    fechaActualizacion: '2026-08-22T19:20:23.874Z',
    fechaVencimiento: '2026-08-24T00:00:00',
  },
  {
    plazo: 69,
    montoContado: 457_283,
    tasaActual: 18,
    tasaMinDia: 18,
    tasaMaxDia: 18,
    fechaOperacion: '2026-08-22',
    fechaActualizacion: '2026-08-22T19:20:23.874Z',
    fechaVencimiento: '2026-10-28T00:00:00',
  },
]

describe('daysBetweenDateOnly', () => {
  it('cuenta días calendario sin timezone drift', () => {
    expect(daysBetweenDateOnly('2026-08-22', '2026-08-24T00:00:00')).toBe(2)
    expect(daysBetweenDateOnly('2026-08-22', '2026-10-28T00:00:00')).toBe(67)
  })
})

describe('isPlazoCoherentWithVencimiento', () => {
  it('acepta plazos cercanos al calendario y rechaza outliers +160', () => {
    expect(isPlazoCoherentWithVencimiento(3, '2026-08-22', '2026-08-24T00:00:00')).toBe(true)
    expect(isPlazoCoherentWithVencimiento(4, '2026-08-22', '2026-08-24T00:00:00')).toBe(true)
    expect(isPlazoCoherentWithVencimiento(162, '2026-08-22', '2026-08-24T00:00:00')).toBe(false)
    expect(isPlazoCoherentWithVencimiento(69, '2026-08-22', '2026-10-28T00:00:00')).toBe(true)
  })

  it('acepta overnight/T+1 con vencimiento un día antes (glitch de fuente)', () => {
    expect(isPlazoCoherentWithVencimiento(1, '2026-08-27', '2026-08-26T00:00:00')).toBe(true)
    expect(isPlazoCoherentWithVencimiento(160, '2026-08-27', '2026-08-28T00:00:00')).toBe(false)
  })
})

describe('mapCaucionItems', () => {
  it('filtra plazos incoherentes y deriva fechas', () => {
    const rows = mapCaucionItems(sample, 'ars')
    expect(rows.map((row) => row.plazo)).toEqual([3, 69])
    expect(rows[0]?.fechaOperacionDate).toBe('2026-08-22')
    expect(rows[0]?.fechaVencimientoDate).toBe('2026-08-24')
    expect(rows[0]?.diasAlVencimiento).toBe(2)
    expect(rows[0]?.fechaActualizacion).toBe('2026-08-22T19:20:23.874Z')
  })

  it('incluye plazo 1 aunque el vencimiento venga un día atrás', () => {
    const rows = mapCaucionItems(
      [
        {
          plazo: 1,
          montoContado: 4_982_631_325_411,
          tasaActual: 19.5,
          tasaMinDia: 12,
          tasaMaxDia: 21.1,
          fechaOperacion: '2026-08-27',
          fechaActualizacion: '2026-08-27T18:29:48.002Z',
          fechaVencimiento: '2026-08-26T00:00:00',
        },
        {
          plazo: 160,
          montoContado: 7_536_677,
          tasaActual: 21.1,
          tasaMinDia: 20.1,
          tasaMaxDia: 21.1,
          fechaOperacion: '2026-08-27',
          fechaActualizacion: '2026-08-27T18:29:48.002Z',
          fechaVencimiento: '2026-08-28T00:00:00',
        },
      ],
      'ars',
    )
    expect(rows.map((row) => row.plazo)).toEqual([1])
    expect(rows[0]?.tasaActual).toBe(19.5)
  })
})
