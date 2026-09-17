import { describe, expect, it } from 'vitest'
import { extractRemProximos12Meses } from './rem'

describe('extractRemProximos12Meses', () => {
  it('prefers mediana for IPC nivel general proximos_12_meses', () => {
    const result = extractRemProximos12Meses([
      {
        muestra: 'todos',
        indicador: 'Precios minoristas (IPC nivel general-Nacional; INDEC)',
        periodo: 'próx. 12 meses',
        periodoTipo: 'proximos_12_meses',
        periodoDesde: null,
        promedio: 21.2,
        mediana: 21.8,
        informe: '2026-07',
        publicacionUrl: 'https://example.com',
      },
    ])

    expect(result).toEqual({
      medianaPercent: 21.8,
      promedioPercent: 21.2,
      informe: '2026-07',
      publicacionUrl: 'https://example.com',
    })
  })
})
