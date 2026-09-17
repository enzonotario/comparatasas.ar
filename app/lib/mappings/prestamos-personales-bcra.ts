/**
 * Catálogo de préstamos personales BCRA a mostrar en el front.
 *
 * Editá `prestamosPersonalesBcraMostrar` para agregar, quitar o ajustar entidades/productos.
 * El match preferido es `codigoEntidad`; `entidad` es fallback (alias del API).
 */

export interface PrestamoPersonalBcraEntidadConfig {
  /** Código de entidad BCRA (ej. `"11"`). */
  codigoEntidad: string
  /** Alias corto del API (ej. `"BNA"`). */
  entidad: string
  /**
   * Si se define, solo estos `productoCorto` (match exacto, case-insensitive).
   * Si es `null` o se omite, se incluyen todos los productos de la entidad (tras curación).
   */
  productosCortos?: string[] | null
  /** `false` para ocultar sin borrar la entrada. Default: `true`. */
  enabled?: boolean
}

export interface PrestamosPersonalesBcraDefaults {
  /** Preferir filas con territorio nacional cuando existan. */
  preferTerritorioNacional: boolean
  /** Cuántas variantes (beneficiario) conservar por productoCorto. */
  maxVariantesPorProducto: number
  /**
   * Prioridad de beneficiario (substring, case-insensitive).
   * Menor índice = más preferido al empatar / elegir variantes.
   */
  preferBeneficiarioIncludes: string[]
}

/** Preferencias globales de curación (territorio, variantes, beneficiario). */
export const prestamosPersonalesBcraDefaults: PrestamosPersonalesBcraDefaults = {
  preferTerritorioNacional: true,
  maxVariantesPorProducto: 1,
  preferBeneficiarioIncludes: [
    'todos los beneficiarios',
    'clientes que acrediten sueldos',
    'clientes con cuenta',
  ],
}

/**
 * Entidades/productos visibles en la sección "Techos BCRA".
 * Orden del array = orden de agrupación en UI (el ranking interno sigue siendo por CFT máx).
 */
export const prestamosPersonalesBcraMostrar: PrestamoPersonalBcraEntidadConfig[] = [
  {
    codigoEntidad: '11',
    entidad: 'BNA',
    // Productos personales generales (sin autos / adelantos).
    productosCortos: ['NACION SUELDOS', 'NACION LIBRE DESTINO', 'NACION PREVISIONAL'],
  },
  {
    codigoEntidad: '17',
    entidad: 'BBVA',
  },
  {
    codigoEntidad: '7',
    entidad: 'GALICIA',
  },
  {
    codigoEntidad: '285',
    entidad: 'MACRO',
  },
  {
    codigoEntidad: '72',
    entidad: 'SANTANDER',
    productosCortos: ['SUPER PRESTAMO PERSONAL'],
  },
  {
    codigoEntidad: '27',
    entidad: 'SUPERVIELLE',
  },
  {
    codigoEntidad: '384',
    entidad: 'UALA',
  },
  {
    codigoEntidad: '72634',
    entidad: 'MERCADOPAGO',
  },
]
