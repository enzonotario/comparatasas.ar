/** Respuesta de `/v1/finanzas/bonos-cer` (ArgentinaDatos). */

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Días calendario hasta el vencimiento (ISO `yyyy-MM-dd`), desde hoy local. */
export function diasAlVencimientoCer(fechaVencimiento: string): number {
  const [y, m, d] = fechaVencimiento.split('-').map(Number)
  const vto = startOfLocalDay(new Date(y!, m! - 1, d!))
  const hoy = startOfLocalDay(new Date())
  return Math.max(0, Math.round((vto.getTime() - hoy.getTime()) / 86_400_000))
}

/** Aproximación en años (365.25 días) solo para UI; el dato canónico es `fechaVencimiento`. */
export function durationYearsCerAprox(fechaVencimiento: string): number {
  return Math.round((diasAlVencimientoCer(fechaVencimiento) / 365.25) * 100) / 100
}

export interface CerBondRow {
  ticker: string
  precioArs: number
  tirPorcentaje: number
  fechaVencimiento: string
  volumen?: number
}

export interface BonosCerPayload {
  /** ISO 8601 en UTC (sufijo `Z`). */
  fechaActualizacion: string
  bonos: CerBondRow[]
  errorExtraccion?: string
}

export function useBonosCer() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('bonos-cer', () =>
    $fetch<BonosCerPayload>('https://api.argentinadatos.com/v1/finanzas/bonos-cer'),
  )

  const bonds = computed(() => data.value?.bonos ?? [])

  return {
    data,
    bonds,
    loading,
    error,
    fetch,
  }
}
