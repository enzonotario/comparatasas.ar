import { describe, expect, it } from 'vitest'
import {
  aclaracionesDeTramos,
  agruparOfertasFal,
  filterAlternativasFal,
  formatComisionFal,
  formatMontoFal,
  presetsEmpleadosFal,
  presetsSueldoFal,
  resumenTasasFal,
  simularAporteFal,
  sortAlternativasFal,
  tiposEmpresaFal,
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

  it('une los honorarios del mismo fondo y deja cada aclaración', () => {
    const wise = [
      fila({
        entidad: 'wise-capital',
        nombreComercial: 'Wise Capital',
        plan: 'honorario-0',
        nombrePlan: 'Honorario 0%',
        horizonte: 'rendimiento',
        comisionAnual: 0,
        comisionPosteriorAnual: 0,
        condiciones:
          'Hasta diciembre de 2027 el honorario es 0% para todos los clientes. Desde enero de 2028 el 0% pide pasar sueldos y la tesorería.',
      }),
      fila({
        entidad: 'wise-capital',
        nombreComercial: 'Wise Capital',
        plan: 'honorario-0-8',
        nombrePlan: 'Honorario 0,80%',
        horizonte: 'rendimiento',
        comisionAnual: 0,
        comisionVigenciaHasta: '2027-12-31',
        comisionPosteriorAnual: 0.008,
        condiciones:
          'Hasta diciembre de 2027 el honorario es 0%. Desde enero de 2028 pasa a 0,80% anual si se suscriben los saldos.',
      }),
      fila({
        entidad: 'wise-capital',
        nombreComercial: 'Wise Capital',
        plan: 'honorario-1',
        nombrePlan: 'Honorario 1%',
        horizonte: 'rendimiento',
        comisionAnual: 0,
        comisionVigenciaHasta: '2027-12-31',
        comisionPosteriorAnual: 0.01,
        condiciones:
          'Hasta diciembre de 2027 el honorario es 0%. Desde enero de 2028 el 1% anual no exige pasar sueldos.',
      }),
    ]
    const bbva = [
      fila({ entidad: 'bbva', plan: 'fal-i', horizonte: 'corto_plazo' }),
      fila({ entidad: 'bbva', plan: 'fal-ii', horizonte: 'inflacion' }),
    ]

    const grupos = agruparOfertasFal([...wise, ...bbva])
    expect(grupos).toHaveLength(3)
    expect(grupos[0]?.ofertas).toHaveLength(3)
    expect(grupos[0]?.nombrePlan).toBeNull()
    expect(resumenTasasFal(wise)).toBe('0% · luego 0% a 1%')

    const aclaraciones = aclaracionesDeTramos(wise)
    expect(aclaraciones.comun).toBe(
      'Hasta diciembre de 2027 el honorario es 0% para todos los clientes.',
    )
    expect(aclaraciones.tramos.map((tramo) => tramo.titulo)).toEqual([
      'Honorario 0%',
      'Honorario 0,80%',
      'Honorario 1%',
    ])
    expect(aclaraciones.tramos[0]?.detalle).toBe(
      'Desde enero de 2028 el 0% pide pasar sueldos y la tesorería.',
    )
    expect(grupos.slice(1).map((grupo) => grupo.plan)).toEqual(['fal-i', 'fal-ii'])
  })

  it('estima el aporte FAL con 13 sueldos por año', () => {
    const pyme = simularAporteFal({
      empleados: 500,
      sueldoBruto: 1_400_000,
      alicuota: tiposEmpresaFal.mipyme.alicuota,
    })

    expect(pyme.masaSalarial).toBe(700_000_000)
    expect(pyme.aporteMensual).toBe(17_500_000)
    expect(pyme.capitalUnAnio).toBe(227_500_000)
    expect(pyme.capitalTresAnios).toBe(682_500_000)
    expect(formatMontoFal(pyme.masaSalarial)).toBe('$700 M')
    expect(formatMontoFal(pyme.aporteMensual)).toBe('$17,5 M')
    expect(formatMontoFal(1_500_000_000)).toBe('$1,5 MM')

    const grande = simularAporteFal({
      empleados: 3000,
      sueldoBruto: 2_500_000,
      alicuota: tiposEmpresaFal.grande.alicuota,
    })
    expect(grande.aporteMensual).toBe(75_000_000)
  })

  it('propone empresa grande solo en el preset de 3000 empleados', () => {
    expect(presetsEmpleadosFal.map((preset) => [preset.empleados, preset.tipo])).toEqual([
      [5, 'mipyme'],
      [50, 'mipyme'],
      [500, 'mipyme'],
      [3000, 'grande'],
    ])
    expect(presetsSueldoFal.map((sueldo) => formatMontoFal(sueldo))).toEqual([
      '$1 M',
      '$1,4 M',
      '$2 M',
      '$2,5 M',
    ])
  })
})
