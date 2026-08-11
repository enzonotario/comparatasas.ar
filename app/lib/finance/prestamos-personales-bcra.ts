import {
  prestamosPersonalesBcraDefaults,
  prestamosPersonalesBcraMostrar,
  type PrestamoPersonalBcraEntidadConfig,
  type PrestamosPersonalesBcraDefaults,
} from '../mappings/prestamos-personales-bcra'

export interface PrestamoPersonalBcraMetadata {
  montoMin?: number | null
  montoMax?: number | null
  plazoMaxMeses?: number | null
  ingresoMinMensual?: number | null
  antiguedadLaboralMinMeses?: number | null
  edadMax?: number | null
  afectacionIngresos?: string | null
  cargoCancelacionAnticipada?: number | null
  cuotaInicialPor10000?: number | null
  territorio?: string | null
  notas?: string | null
  fuente?: string
  [key: string]: unknown
}

export interface PrestamoPersonalBcra {
  codigoEntidad: string
  entidad: string
  nombreComercial: string
  producto: string | null
  productoCorto: string | null
  moneda: string
  /** TEA máxima en puntos porcentuales (93.32 = 93,32 %). */
  teaMax: number | null
  /** CFT TEA máximo en puntos porcentuales. */
  cftTeaMax: number | null
  tipoTasa: string | null
  requiereCliente: boolean | null
  condiciones: string | null
  vigenciaDesde: string | null
  enlace: string
  metadata?: PrestamoPersonalBcraMetadata
}

export interface PrestamoPersonalBcraApiItem {
  codigoEntidad: string
  entidad: string
  nombreComercial: string
  producto: string | null
  productoCorto: string | null
  moneda: string
  teaMax: number | null
  cftTeaMax: number | null
  tipoTasa: string | null
  requiereCliente: boolean | null
  condiciones: string | null
  vigenciaDesde: string | null
  enlace: string
  metadata?: PrestamoPersonalBcraMetadata
}

function toPct(value: number | null | undefined): number | null {
  return value == null ? null : value * 100
}

function norm(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function isTerritorioNacional(item: PrestamoPersonalBcraApiItem): boolean {
  return norm(item.metadata?.territorio).startsWith('todo el territorio')
}

function beneficiarioScore(
  condiciones: string | null | undefined,
  preferIncludes: string[],
): number {
  const text = norm(condiciones)
  if (!text) return preferIncludes.length + 1

  const idx = preferIncludes.findIndex((needle) => text.includes(norm(needle)))
  return idx === -1 ? preferIncludes.length : idx
}

function sortKeyCft(item: PrestamoPersonalBcraApiItem): number {
  return item.cftTeaMax ?? item.teaMax ?? Number.POSITIVE_INFINITY
}

function matchesEntidad(
  item: PrestamoPersonalBcraApiItem,
  config: PrestamoPersonalBcraEntidadConfig,
): boolean {
  if (config.codigoEntidad && item.codigoEntidad === config.codigoEntidad) return true
  return norm(item.entidad) === norm(config.entidad)
}

function matchesProducto(
  item: PrestamoPersonalBcraApiItem,
  config: PrestamoPersonalBcraEntidadConfig,
): boolean {
  if (!config.productosCortos?.length) return true
  const corto = norm(item.productoCorto)
  return config.productosCortos.some((p) => norm(p) === corto)
}

/**
 * Filtra y cura el CSV BCRA según el catálogo editable.
 * - Solo entidades `enabled` del mapa
 * - Opcional: whitelist de `productoCorto`
 * - Prefiere territorio nacional
 * - Conserva las N mejores variantes por producto (menor CFT máx + beneficiario preferido)
 */
export function curarPrestamosPersonalesBcra(
  items: PrestamoPersonalBcraApiItem[],
  options?: {
    catalog?: PrestamoPersonalBcraEntidadConfig[]
    defaults?: PrestamosPersonalesBcraDefaults
  },
): PrestamoPersonalBcraApiItem[] {
  const catalog = options?.catalog ?? prestamosPersonalesBcraMostrar
  const defaults = options?.defaults ?? prestamosPersonalesBcraDefaults
  const enabled = catalog.filter((c) => c.enabled !== false)

  const selected: PrestamoPersonalBcraApiItem[] = []

  for (const config of enabled) {
    let pool = items.filter(
      (item) => matchesEntidad(item, config) && matchesProducto(item, config),
    )

    if (!pool.length) continue

    if (defaults.preferTerritorioNacional) {
      const nacionales = pool.filter(isTerritorioNacional)
      if (nacionales.length) pool = nacionales
    }

    const byProducto = new Map<string, PrestamoPersonalBcraApiItem[]>()
    for (const item of pool) {
      const key = norm(item.productoCorto) || norm(item.producto) || '_sin_producto'
      const list = byProducto.get(key) ?? []
      list.push(item)
      byProducto.set(key, list)
    }

    const maxVariantes = Math.max(1, defaults.maxVariantesPorProducto)

    for (const variantes of byProducto.values()) {
      const ranked = [...variantes].sort((a, b) => {
        const cft = sortKeyCft(a) - sortKeyCft(b)
        if (cft !== 0) return cft

        const benef =
          beneficiarioScore(a.condiciones, defaults.preferBeneficiarioIncludes) -
          beneficiarioScore(b.condiciones, defaults.preferBeneficiarioIncludes)
        if (benef !== 0) return benef

        return norm(a.condiciones).localeCompare(norm(b.condiciones), 'es')
      })

      // Evitar duplicar el mismo CFT+beneficiario
      const picked: PrestamoPersonalBcraApiItem[] = []
      const seen = new Set<string>()
      for (const item of ranked) {
        const dedupeKey = `${sortKeyCft(item)}|${norm(item.condiciones)}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        picked.push(item)
        if (picked.length >= maxVariantes) break
      }

      selected.push(...picked)
    }
  }

  return selected.sort((a, b) => {
    const cft = sortKeyCft(a) - sortKeyCft(b)
    if (cft !== 0) return cft
    return norm(a.entidad).localeCompare(norm(b.entidad), 'es')
  })
}

export function mapPrestamoPersonalBcraApi(
  item: PrestamoPersonalBcraApiItem,
): PrestamoPersonalBcra {
  return {
    ...item,
    teaMax: toPct(item.teaMax),
    cftTeaMax: toPct(item.cftTeaMax),
    metadata: item.metadata
      ? {
          ...item.metadata,
          cargoCancelacionAnticipada:
            item.metadata.cargoCancelacionAnticipada != null
              ? item.metadata.cargoCancelacionAnticipada * 100
              : null,
        }
      : undefined,
  }
}
