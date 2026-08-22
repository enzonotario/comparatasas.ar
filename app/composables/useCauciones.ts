/** Respuesta de `/v1/finanzas/cauciones/{ars|usd}` (ArgentinaDatos). */

export type CaucionMoneda = 'ars' | 'usd'

export interface CaucionApiItem {
  plazo: number
  montoContado: number
  tasaActual: number
  tasaMinDia: number
  tasaMaxDia: number
  /** Fecha de la rueda, p. ej. `2026-08-22`. */
  fechaOperacion: string
  /** ISO datetime de refresh del snapshot, p. ej. `2026-08-22T19:20:23.874Z`. */
  fechaActualizacion?: string | null
  /** ISO datetime, p. ej. `2026-08-24T00:00:00`. */
  fechaVencimiento: string
}

export interface CaucionRow extends CaucionApiItem {
  moneda: CaucionMoneda
  fechaOperacionDate: string
  fechaVencimientoDate: string
  /** Días calendario entre operación y vencimiento. */
  diasAlVencimiento: number
}

const API_BASE = 'https://api.argentinadatos.com/v1/finanzas/cauciones'

/** IOL a veces mezcla series con plazo ~calendario+160; toleramos el desfase habitual ±5. */
const PLAZO_CALENDARIO_TOLERANCIA = 5

export function toDateOnly(iso: string): string {
  const datePart = iso.split('T')[0]
  return datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : iso.slice(0, 10)
}

/** Diferencia en días calendario (UTC date-only), sin timezone drift. */
export function daysBetweenDateOnly(from: string, to: string): number {
  const a = Date.parse(`${toDateOnly(from)}T00:00:00Z`)
  const b = Date.parse(`${toDateOnly(to)}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN
  return Math.round((b - a) / 86_400_000)
}

/**
 * Descarta plazos que no calzan con la fecha de vencimiento (p. ej. 162d con vto. en 2 días).
 */
export function isPlazoCoherentWithVencimiento(
  plazo: number,
  fechaOperacion: string,
  fechaVencimiento: string,
  tolerancia = PLAZO_CALENDARIO_TOLERANCIA,
): boolean {
  const dias = daysBetweenDateOnly(fechaOperacion, fechaVencimiento)
  if (!Number.isFinite(dias) || dias < 0) return false
  return Math.abs(plazo - dias) <= tolerancia
}

export function mapCaucionItems(
  items: CaucionApiItem[] | null | undefined,
  moneda: CaucionMoneda,
): CaucionRow[] {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item) =>
        Number.isFinite(item.plazo) &&
        item.plazo > 0 &&
        Number.isFinite(item.tasaActual) &&
        Number.isFinite(item.montoContado) &&
        Number.isFinite(item.tasaMinDia) &&
        Number.isFinite(item.tasaMaxDia) &&
        Boolean(item.fechaOperacion) &&
        Boolean(item.fechaVencimiento) &&
        isPlazoCoherentWithVencimiento(item.plazo, item.fechaOperacion, item.fechaVencimiento),
    )
    .map((item) => {
      const fechaOperacionDate = toDateOnly(item.fechaOperacion)
      const fechaVencimientoDate = toDateOnly(item.fechaVencimiento)
      return {
        ...item,
        moneda,
        fechaOperacionDate,
        fechaVencimientoDate,
        diasAlVencimiento: daysBetweenDateOnly(fechaOperacionDate, fechaVencimientoDate),
      }
    })
    .sort((a, b) => a.plazo - b.plazo || b.montoContado - a.montoContado)
}

async function fetchCaucionesMoneda(moneda: CaucionMoneda): Promise<CaucionRow[]> {
  const items = await $fetch<CaucionApiItem[]>(`${API_BASE}/${moneda}`)
  return mapCaucionItems(items, moneda)
}

export function useCauciones(moneda: MaybeRefOrGetter<CaucionMoneda>) {
  const monedaRef = computed(() => toValue(moneda))

  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData(
    () => `cauciones-${monedaRef.value}`,
    () => fetchCaucionesMoneda(monedaRef.value),
    { watch: [monedaRef] },
  )

  const items = computed(() => data.value ?? [])

  /** Fecha de operación común del lote (si todas coinciden). */
  const fechaOperacion = computed(() => {
    const dates = [...new Set(items.value.map((row) => row.fechaOperacionDate).filter(Boolean))]
    return dates.length === 1 ? dates[0]! : null
  })

  /** Última actualización del snapshot (max ISO entre filas). */
  const fechaActualizacion = computed(() => {
    const stamps = items.value
      .map((row) => row.fechaActualizacion)
      .filter((value): value is string => Boolean(value))
    if (!stamps.length) return null
    return stamps.sort().at(-1) ?? null
  })

  return {
    items,
    loading,
    error,
    fetch,
    fechaOperacion,
    fechaActualizacion,
  }
}
