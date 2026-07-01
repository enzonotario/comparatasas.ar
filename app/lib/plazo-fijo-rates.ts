import type { TasaPlazoFijo } from '../types/investments'

export interface PlazoFijoPlazoColumn {
  key: string
  label: string
  plazoMinDias: number
  plazoMaxDias: number | null
}

/** Columnas fijas mostradas en la tabla de plazos fijos tradicionales. */
export const STANDARD_PLAZO_COLUMNS: PlazoFijoPlazoColumn[] = [
  { key: '30', label: '30d', plazoMinDias: 30, plazoMaxDias: 44 },
  { key: '60', label: '60d', plazoMinDias: 60, plazoMaxDias: 89 },
  { key: '90', label: '90d', plazoMinDias: 90, plazoMaxDias: 119 },
  { key: '365', label: '1 año', plazoMinDias: 365, plazoMaxDias: 365 },
]

export interface PlazoFijoRateCell {
  tna: number
  label?: string
  montoMinimo?: number | null
  montoMaximo?: number | null
}

export function getPlazoKey(tasa: Pick<TasaPlazoFijo, 'plazoMinDias' | 'plazoMaxDias'>): string {
  if (tasa.plazoMaxDias == null || tasa.plazoMinDias !== tasa.plazoMaxDias) {
    return `${tasa.plazoMinDias}-${tasa.plazoMaxDias ?? '+'}`
  }
  return String(tasa.plazoMinDias)
}

/** Tramos que no se muestran en la tabla (p. ej. Voii 45–59 días). */
export function isExcludedPlazoTasa(
  tasa: Pick<TasaPlazoFijo, 'plazoMinDias' | 'plazoMaxDias'>,
): boolean {
  return tasa.plazoMinDias === 45 && tasa.plazoMaxDias === 59
}

/** Clave de columna estándar en la UI; null si el tramo no corresponde a 30/60/90/365 días. */
export function getDisplayPlazoKey(
  tasa: Pick<TasaPlazoFijo, 'plazoMinDias' | 'plazoMaxDias'>,
): string | null {
  if (isExcludedPlazoTasa(tasa)) return null

  const { plazoMinDias, plazoMaxDias } = tasa

  if (plazoMinDias === 30 && (plazoMaxDias === 30 || plazoMaxDias === 44)) return '30'
  if (plazoMinDias === 60 && (plazoMaxDias === 60 || plazoMaxDias === 89)) return '60'
  if (plazoMinDias === 90 && (plazoMaxDias === 90 || plazoMaxDias === 119)) return '90'
  if (plazoMinDias === 365 && plazoMaxDias === 365) return '365'

  return null
}

export function getPlazoColumnLabel(key: string): string {
  if (key.includes('-')) {
    const [min, max] = key.split('-')
    if (max === '+') return `${min}+ días`
    return `${min}–${max} días`
  }
  return `${key} días`
}

export function parsePlazoKey(key: string): { plazoMinDias: number; plazoMaxDias: number | null } {
  if (key.includes('-')) {
    const [min, max] = key.split('-')
    return {
      plazoMinDias: Number(min),
      plazoMaxDias: max === '+' ? null : Number(max),
    }
  }
  const days = Number(key)
  return { plazoMinDias: days, plazoMaxDias: days }
}

export function comparePlazoKeys(a: string, b: string): number {
  const pa = parsePlazoKey(a)
  const pb = parsePlazoKey(b)
  if (pa.plazoMinDias !== pb.plazoMinDias) return pa.plazoMinDias - pb.plazoMinDias
  const maxA = pa.plazoMaxDias ?? Number.POSITIVE_INFINITY
  const maxB = pb.plazoMaxDias ?? Number.POSITIVE_INFINITY
  return maxA - maxB
}

export function formatMontoCompact(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatMontoRange(montoMinimo: number | null, montoMaximo: number | null): string {
  if (montoMinimo == null && montoMaximo == null) return ''
  if (montoMinimo == null && montoMaximo != null) return `Hasta ${formatMontoCompact(montoMaximo)}`
  if (montoMinimo != null && montoMaximo == null) return `Desde ${formatMontoCompact(montoMinimo)}`
  if (montoMinimo != null && montoMaximo != null) {
    return `${formatMontoCompact(montoMinimo)}-${formatMontoCompact(montoMaximo)}`
  }
  return ''
}

export function buildTierLabel(tasa: TasaPlazoFijo): string | undefined {
  const monto = formatMontoRange(tasa.montoMinimo, tasa.montoMaximo)
  return monto || undefined
}

export function getRootTnaDecimal(entity: {
  tnaClientes: number
  tnaNoClientes: number | null
}): number {
  return entity.tnaClientes || entity.tnaNoClientes || 0
}

/** Prioriza la TNA publicada en el root para la columna de 30 días. */
export function mergeRootTnaFor30d(
  ratesByPlazo: Record<string, PlazoFijoRateCell[]>,
  rootTnaDecimal: number,
): Record<string, PlazoFijoRateCell[]> {
  if (rootTnaDecimal <= 0) return ratesByPlazo

  const rootTna = rootTnaDecimal * 100
  const existing = ratesByPlazo['30'] ?? []
  const matchingTier = existing.find((cell) => Math.abs(cell.tna - rootTna) < 0.001)
  const rootCell: PlazoFijoRateCell = matchingTier ?? { tna: rootTna }
  const tieredExtras = existing.filter(
    (cell) =>
      (cell.montoMinimo != null || cell.montoMaximo != null) &&
      Math.abs(cell.tna - rootTna) > 0.001,
  )

  return {
    ...ratesByPlazo,
    '30': [rootCell, ...tieredExtras].sort(compareRateCells),
  }
}

function compareRateCells(a: PlazoFijoRateCell, b: PlazoFijoRateCell): number {
  if (b.tna !== a.tna) return b.tna - a.tna
  const minA = a.montoMinimo ?? 0
  const minB = b.montoMinimo ?? 0
  if (minA !== minB) return minA - minB
  const maxA = a.montoMaximo ?? Number.POSITIVE_INFINITY
  const maxB = b.montoMaximo ?? Number.POSITIVE_INFINITY
  return maxA - maxB
}

export function getPlazoColumnSortId(plazoKey: string): string {
  return `plazo-${plazoKey}`
}

export function getMaxTnaForPlazoKey(
  ratesByPlazo: Record<string, PlazoFijoRateCell[]>,
  plazoKey: string,
): number {
  const cells = ratesByPlazo[plazoKey]
  if (!cells?.length) return 0
  return Math.max(...cells.map((cell) => cell.tna))
}

export function tasaMatchesDays(tasa: TasaPlazoFijo, days: number, amount?: number): boolean {
  const withinPlazo =
    days >= tasa.plazoMinDias && (tasa.plazoMaxDias == null || days <= tasa.plazoMaxDias)
  if (!withinPlazo) return false
  if (amount == null) return true
  if (tasa.montoMinimo != null && amount < tasa.montoMinimo) return false
  if (tasa.montoMaximo != null && amount > tasa.montoMaximo) return false
  return true
}

export function findMatchingTasa(
  tasas: TasaPlazoFijo[] | undefined,
  days: number,
  amount?: number,
): TasaPlazoFijo | undefined {
  if (!tasas?.length) return undefined
  return tasas.find(
    (tasa) => tasa.tna > 0 && !isExcludedPlazoTasa(tasa) && tasaMatchesDays(tasa, days, amount),
  )
}

function mergePlazoBounds(
  current: { plazoMinDias: number; plazoMaxDias: number | null } | undefined,
  tasa: TasaPlazoFijo,
): { plazoMinDias: number; plazoMaxDias: number | null } {
  if (!current) {
    return { plazoMinDias: tasa.plazoMinDias, plazoMaxDias: tasa.plazoMaxDias }
  }

  return {
    plazoMinDias: Math.min(current.plazoMinDias, tasa.plazoMinDias),
    plazoMaxDias:
      current.plazoMaxDias == null || tasa.plazoMaxDias == null
        ? (current.plazoMaxDias ?? tasa.plazoMaxDias)
        : Math.max(current.plazoMaxDias, tasa.plazoMaxDias),
  }
}

export function buildPlazoColumns(tasas: TasaPlazoFijo[]): PlazoFijoPlazoColumn[] {
  const boundsByKey = new Map<string, { plazoMinDias: number; plazoMaxDias: number | null }>()

  for (const tasa of tasas) {
    if (tasa.tna <= 0) continue
    const key = getDisplayPlazoKey(tasa)
    if (!key) continue
    boundsByKey.set(key, mergePlazoBounds(boundsByKey.get(key), tasa))
  }

  return [...boundsByKey.keys()].sort(comparePlazoKeys).map((key) => {
    const bounds = boundsByKey.get(key)!
    return {
      key,
      label: getPlazoColumnLabel(key),
      plazoMinDias: bounds.plazoMinDias,
      plazoMaxDias: bounds.plazoMaxDias,
    }
  })
}

export function groupRatesByPlazoKey(tasas: TasaPlazoFijo[]): Record<string, PlazoFijoRateCell[]> {
  const grouped: Record<string, PlazoFijoRateCell[]> = {}

  for (const tasa of tasas) {
    if (tasa.tna <= 0) continue
    const key = getDisplayPlazoKey(tasa)
    if (!key) continue
    const cells = grouped[key] ?? []
    cells.push({
      tna: tasa.tna * 100,
      label: buildTierLabel(tasa),
      montoMinimo: tasa.montoMinimo,
      montoMaximo: tasa.montoMaximo,
    })
    grouped[key] = cells
  }

  for (const key of Object.keys(grouped)) {
    grouped[key]!.sort(compareRateCells)
  }

  return grouped
}
