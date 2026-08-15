import { describe, expect, it } from 'vitest'
import {
  curarPrestamosPersonalesBcra,
  mapPrestamoPersonalBcraApi,
  type PrestamoPersonalBcraApiItem,
} from './prestamos-personales-bcra'
import type { PrestamoPersonalBcraEntidadConfig } from '../mappings/prestamos-personales-bcra'

function item(
  partial: Partial<PrestamoPersonalBcraApiItem> &
    Pick<PrestamoPersonalBcraApiItem, 'codigoEntidad' | 'entidad' | 'productoCorto'>,
): PrestamoPersonalBcraApiItem {
  const { metadata: metaPartial, ...rest } = partial

  return {
    codigoEntidad: rest.codigoEntidad,
    entidad: rest.entidad,
    nombreComercial: rest.nombreComercial ?? rest.entidad,
    producto: rest.producto ?? rest.productoCorto,
    productoCorto: rest.productoCorto,
    moneda: rest.moneda ?? 'ARS',
    teaMax: rest.teaMax ?? 1,
    cftTeaMax: rest.cftTeaMax ?? 1.5,
    tipoTasa: rest.tipoTasa ?? 'fija',
    requiereCliente: rest.requiereCliente ?? null,
    condiciones: rest.condiciones ?? 'Todos los beneficiarios',
    vigenciaDesde: rest.vigenciaDesde ?? '2026-01-01',
    enlace: rest.enlace ?? 'https://example.com',
    metadata: {
      territorio: 'Todo el territorio nacional',
      ...metaPartial,
    },
  }
}

describe('curarPrestamosPersonalesBcra', () => {
  const catalog: PrestamoPersonalBcraEntidadConfig[] = [
    {
      codigoEntidad: '11',
      entidad: 'BNA',
      productosCortos: ['NACION SUELDOS', 'NACION LIBRE DESTINO'],
    },
    { codigoEntidad: '27', entidad: 'SUPERVIELLE' },
    { codigoEntidad: '999', entidad: 'OCULTO', enabled: false },
  ]

  it('filtra por catálogo, productos y enabled', () => {
    const rows = [
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'NACION SUELDOS',
        cftTeaMax: 0.9332,
      }),
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'ADELANTO DE HABERES',
        cftTeaMax: 0.5,
      }),
      item({
        codigoEntidad: '999',
        entidad: 'OCULTO',
        productoCorto: 'X',
        cftTeaMax: 0.1,
      }),
      item({
        codigoEntidad: '55',
        entidad: 'OTRO',
        productoCorto: 'Y',
        cftTeaMax: 0.2,
      }),
    ]

    const curated = curarPrestamosPersonalesBcra(rows, { catalog })

    expect(curated).toHaveLength(1)
    expect(curated[0]?.productoCorto).toBe('NACION SUELDOS')
  })

  it('prefiere territorio nacional y el menor CFT máx por producto', () => {
    const rows = [
      item({
        codigoEntidad: '27',
        entidad: 'SUPERVIELLE',
        productoCorto: 'PP',
        condiciones: 'Clientes que acrediten sueldos en la entidad',
        cftTeaMax: 4.1499,
        metadata: { territorio: 'Provincia de San Juan' },
      }),
      item({
        codigoEntidad: '27',
        entidad: 'SUPERVIELLE',
        productoCorto: 'PP',
        condiciones: 'Beneficiarios de cuentas de la seguridad social',
        cftTeaMax: 1.8377,
        metadata: { territorio: 'Provincia de Córdoba' },
      }),
      item({
        codigoEntidad: '27',
        entidad: 'SUPERVIELLE',
        productoCorto: 'PP',
        condiciones: 'Todos los beneficiarios',
        cftTeaMax: 2.5,
        metadata: { territorio: 'Todo el territorio nacional' },
      }),
    ]

    const curated = curarPrestamosPersonalesBcra(rows, {
      catalog,
      defaults: {
        preferTerritorioNacional: true,
        maxVariantesPorProducto: 1,
        preferBeneficiarioIncludes: ['todos los beneficiarios', 'clientes que acrediten sueldos'],
      },
    })

    expect(curated).toHaveLength(1)
    expect(curated[0]?.cftTeaMax).toBe(2.5)
    expect(curated[0]?.condiciones).toBe('Todos los beneficiarios')
  })

  it('si no hay nacional, elige el menor techo entre provincias', () => {
    const rows = [
      item({
        codigoEntidad: '27',
        entidad: 'SUPERVIELLE',
        productoCorto: 'PP',
        cftTeaMax: 4.1499,
        metadata: { territorio: 'Provincia de San Juan' },
      }),
      item({
        codigoEntidad: '27',
        entidad: 'SUPERVIELLE',
        productoCorto: 'PP',
        cftTeaMax: 1.8377,
        metadata: { territorio: 'Provincia de Córdoba' },
      }),
    ]

    const curated = curarPrestamosPersonalesBcra(rows, { catalog })

    expect(curated).toHaveLength(1)
    expect(curated[0]?.cftTeaMax).toBe(1.8377)
  })

  it('respeta maxVariantesPorProducto', () => {
    const rows = [
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'NACION SUELDOS',
        condiciones: 'Clientes que acrediten sueldos en la entidad',
        cftTeaMax: 0.9332,
      }),
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'NACION SUELDOS',
        condiciones: 'Clientes con cuenta en la entidad',
        cftTeaMax: 1.1,
      }),
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'NACION LIBRE DESTINO',
        condiciones: 'Clientes con cuenta en la entidad',
        cftTeaMax: 1.8676,
      }),
    ]

    const curated = curarPrestamosPersonalesBcra(rows, {
      catalog,
      defaults: {
        preferTerritorioNacional: true,
        maxVariantesPorProducto: 2,
        preferBeneficiarioIncludes: ['clientes que acrediten sueldos', 'clientes con cuenta'],
      },
    })

    const sueldos = curated.filter((i) => i.productoCorto === 'NACION SUELDOS')
    expect(sueldos).toHaveLength(2)
    expect(curated.some((i) => i.productoCorto === 'NACION LIBRE DESTINO')).toBe(true)
  })
})

describe('mapPrestamoPersonalBcraApi', () => {
  it('convierte tasas a puntos porcentuales', () => {
    const mapped = mapPrestamoPersonalBcraApi(
      item({
        codigoEntidad: '11',
        entidad: 'BNA',
        productoCorto: 'NACION SUELDOS',
        teaMax: 0.7286,
        cftTeaMax: 0.9332,
        metadata: {
          territorio: 'Todo el territorio nacional',
          cargoCancelacionAnticipada: 0.04,
        },
      }),
    )

    expect(mapped.teaMax).toBeCloseTo(72.86, 2)
    expect(mapped.cftTeaMax).toBeCloseTo(93.32, 2)
    expect(mapped.metadata?.cargoCancelacionAnticipada).toBeCloseTo(4, 4)
  })
})
