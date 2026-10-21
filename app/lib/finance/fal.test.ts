import { describe, expect, it } from 'vitest'
import {
  filterAlternativasFal,
  formatComisionFal,
  sortAlternativasFal,
  type AlternativaFal,
} from './fal'

function fila(parcial: Partial<AlternativaFal> & Pick<AlternativaFal, 'entidad'>): AlternativaFal {
  return {
    nombreComercial: parcial.entidad,
    plan: null,
    nombrePlan: null,
    vehiculo: null,
    sociedadGerente: null,
    sociedadDepositaria: null,
    comisionAnual: null,
    comisionEsTope: false,
    incluyeIva: null,
    ivaAdicional: null,
    comisionVigenciaHasta: null,
    comisionPosteriorAnual: null,
    horizonte: null,
    vidaPromedioMesesMin: null,
    vidaPromedioMesesMax: null,
    moneda: 'ARS',
    reintegroAportes: null,
    canal: null,
    vigenciaDeclarada: null,
    enlace: null,
    condiciones: null,
    ...parcial,
  }
}

describe('FAL', () => {
  it('muestra la comisión promocional y la posterior', () => {
    const label = formatComisionFal(
      fila({
        entidad: 'wise-capital',
        comisionAnual: 0,
        comisionVigenciaHasta: '2027-12-31',
        comisionPosteriorAnual: 0.008,
      }),
    )

    expect(label.startsWith('0% · hasta ')).toBe(true)
    expect(label).toContain('2027')
    expect(label.endsWith('luego 0,80%')).toBe(true)
  })

  it('dice Sin dato cuando no hay comisión publicada', () => {
    expect(formatComisionFal(fila({ entidad: 'balanz' }))).toBe('Sin dato')
  })

  it('ordena por comisión y deja los vacíos al final', () => {
    const orden = sortAlternativasFal(
      [
        fila({ entidad: 'sin', comisionAnual: null }),
        fila({ entidad: 'uno', comisionAnual: 0.01, comisionPosteriorAnual: 0.01 }),
        fila({ entidad: 'cero', comisionAnual: 0, comisionPosteriorAnual: 0 }),
        fila({ entidad: 'promo', comisionAnual: 0, comisionPosteriorAnual: 0.008 }),
      ],
      { id: 'comisionSort', desc: false },
    ).map((row) => row.entidad)

    expect(orden).toEqual(['cero', 'promo', 'uno', 'sin'])
  })

  it('filtra por horizonte y por comisión publicada', () => {
    const rows = [
      fila({ entidad: 'bbva', horizonte: 'corto_plazo', comisionAnual: 0 }),
      fila({ entidad: 'balanz', horizonte: null, comisionAnual: null }),
    ]

    expect(
      filterAlternativasFal(rows, {
        q: '',
        horizonte: 'corto_plazo',
        vehiculo: 'all',
        comision: 'all',
      }).map((row) => row.entidad),
    ).toEqual(['bbva'])

    expect(
      filterAlternativasFal(rows, {
        q: 'balanz',
        horizonte: 'all',
        vehiculo: 'all',
        comision: 'sin_dato',
      }).map((row) => row.entidad),
    ).toEqual(['balanz'])
  })
})
