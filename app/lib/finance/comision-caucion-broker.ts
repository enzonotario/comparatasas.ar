import { formatPercentAuto } from '../fci-fund-formatters'

export const IVA_COMISION_BROKER = 0.21
export const DIAS_BASE_TNA = 365
/** Convención money-market para comisión mensual publicada. */
export const DIAS_MES_COMISION = 30
/** BYMA cauciones: derecho de mercado suele prorratearse (IOL c/ 90d). */
export const DIAS_PRORRATEO_DERECHO_DEFAULT = 90

export type OperacionCaucionBroker = 'colocadora' | 'tomadora' | 'ambas'
export type OperacionCaucionFilter = 'colocadora' | 'tomadora'

export interface ComisionCaucionBrokerApi {
  entidad: string
  nombreComercial: string
  producto: string
  operacion: OperacionCaucionBroker | string
  moneda: string
  canal: string
  plan: string | null
  tasa: number | null
  tasaBase: 'mensual' | 'anual' | 'tna' | null
  tasaAnualEquivalente: number | null
  tasaEsTope: boolean
  incluyeIva: boolean
  ivaAdicional: boolean
  prorrateoDias: number | null
  comisionMinima: number | null
  /** Costo fijo de plan/membresía en la moneda de la fila (null si no aplica). */
  membresiaMensual?: number | null
  membresiaIvaAdicional?: boolean
  derechoMercado: number | null
  enlace: string | null
  metadata?: Record<string, unknown> | null
}

const TASA_BASE_LABELS: Record<string, string> = {
  mensual: 'mensual',
  anual: 'anual',
  tna: 'TNA',
}

const PLAN_LABELS: Record<string, string> = {
  gold: 'Gold',
  platinum: 'Platinum',
  black: 'Black',
  personas_humanas: 'Personas humanas',
  investor: 'Investor',
  rookie: 'Rookie',
  global_markets: 'Global Markets',
}

const PLAN_PRIORITY: Record<string, number> = {
  personas_humanas: 0,
  gold: 1,
  platinum: 2,
  black: 3,
}

/** Tasa anual comparable para ordenar (decimal, ej. 0.018 = 1,8% anual). */
export function tasaComparableAnual(row: ComisionCaucionBrokerApi): number | null {
  if (typeof row.tasaAnualEquivalente === 'number' && Number.isFinite(row.tasaAnualEquivalente)) {
    return row.tasaAnualEquivalente
  }
  if (row.tasa == null || !Number.isFinite(row.tasa)) return null
  if (row.tasaBase === 'mensual') return row.tasa * 12
  if (row.tasaBase === 'anual' || row.tasaBase === 'tna') return row.tasa
  return row.tasa
}

export function matchesOperacionFilter(
  operacion: string,
  filter: OperacionCaucionFilter,
): boolean {
  if (operacion === 'ambas') return true
  return operacion === filter
}

export function formatTasaPublicada(row: ComisionCaucionBrokerApi): string {
  if (row.tasa == null || !Number.isFinite(row.tasa)) return 'Consultar'

  const pct = row.tasa * 100
  const formatted = formatPercentAuto(pct)
  const base = row.tasaBase ? TASA_BASE_LABELS[row.tasaBase] ?? row.tasaBase : null
  const prefix = row.tasaEsTope ? 'Hasta ' : ''

  if (base) return `${prefix}${formatted} ${base}`
  return `${prefix}${formatted}`
}

export function formatTasaAnualComparable(row: ComisionCaucionBrokerApi): string {
  const anual = tasaComparableAnual(row)
  if (anual == null) return '—'
  return `${formatPercentAuto(anual * 100)} anual equiv.`
}

/** Membresía/plan en moneda de la fila, p. ej. "$5.000/mes + IVA". */
export function formatMembresiaMensual(
  row: Pick<ComisionCaucionBrokerApi, 'membresiaMensual' | 'membresiaIvaAdicional' | 'moneda'>,
): string | null {
  const monto = row.membresiaMensual
  if (monto == null || !Number.isFinite(monto)) return null

  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: row.moneda === 'USD' ? 'USD' : 'ARS',
    maximumFractionDigits: monto % 1 === 0 ? 0 : 2,
  }).format(monto)

  const iva = row.membresiaIvaAdicional ? ' + IVA' : ''
  return `${formatted}/mes${iva}`
}

export function formatPlanLabel(plan: string | null | undefined): string | null {
  if (!plan) return null
  return PLAN_LABELS[plan] ?? plan.replace(/_/g, ' ')
}

function planSortKey(plan: string | null | undefined): number {
  if (!plan) return -1
  return PLAN_PRIORITY[plan] ?? 50
}

/** Una fila por broker: la comisión retail más baja (mejor para el usuario). */
export function pickBestComisionPorEntidad(
  rows: ComisionCaucionBrokerApi[],
): ComisionCaucionBrokerApi[] {
  const byEntidad = new Map<string, ComisionCaucionBrokerApi[]>()

  for (const row of rows) {
    const list = byEntidad.get(row.entidad) ?? []
    list.push(row)
    byEntidad.set(row.entidad, list)
  }

  const picked: ComisionCaucionBrokerApi[] = []

  for (const group of byEntidad.values()) {
    const sorted = [...group].sort((a, b) => {
      const ta = tasaComparableAnual(a) ?? Number.POSITIVE_INFINITY
      const tb = tasaComparableAnual(b) ?? Number.POSITIVE_INFINITY
      if (ta !== tb) return ta - tb
      return planSortKey(a.plan) - planSortKey(b.plan)
    })
    if (sorted[0]) picked.push(sorted[0])
  }

  return picked.sort((a, b) => {
    const ta = tasaComparableAnual(a) ?? Number.POSITIVE_INFINITY
    const tb = tasaComparableAnual(b) ?? Number.POSITIVE_INFINITY
    return ta - tb
  })
}

export function filterComisionesCauciones(
  comisiones: ComisionCaucionBrokerApi[] | null | undefined,
  options: {
    moneda: 'ARS' | 'USD'
    operacion: OperacionCaucionFilter
    dedupePorEntidad?: boolean
  },
): ComisionCaucionBrokerApi[] {
  const filtered = (comisiones ?? []).filter(
    (row) =>
      row.producto === 'cauciones' &&
      row.moneda === options.moneda &&
      matchesOperacionFilter(row.operacion, options.operacion),
  )

  if (options.dedupePorEntidad === false) {
    return [...filtered].sort((a, b) => {
      const ta = tasaComparableAnual(a) ?? Number.POSITIVE_INFINITY
      const tb = tasaComparableAnual(b) ?? Number.POSITIVE_INFINITY
      return ta - tb
    })
  }

  return pickBestComisionPorEntidad(filtered)
}

/** Mejor fila de comisión para un broker, moneda y rol. */
export function getComisionBroker(
  comisiones: ComisionCaucionBrokerApi[] | null | undefined,
  entidad: string,
  moneda: 'ARS' | 'USD',
  operacion: OperacionCaucionFilter,
): ComisionCaucionBrokerApi | null {
  const rows = (comisiones ?? []).filter(
    (row) =>
      row.producto === 'cauciones' &&
      row.moneda === moneda &&
      row.entidad === entidad &&
      matchesOperacionFilter(row.operacion, operacion),
  )
  if (!rows.length) return null
  return pickBestComisionPorEntidad(rows)[0] ?? null
}

/**
 * Costo de comisión del broker como % del capital en el plazo.
 * Respeta la base publicada (mensual vs anual/TNA), no solo el equivalente anual.
 */
export function comisionCostoPctPlazo(
  comision: ComisionCaucionBrokerApi,
  plazo: number,
): number {
  if (!Number.isFinite(plazo) || plazo <= 0) return 0
  if (comision.tasa == null || !Number.isFinite(comision.tasa)) return 0

  let pct: number
  if (comision.tasaBase === 'mensual') {
    pct = comision.tasa * 100 * (plazo / DIAS_MES_COMISION)
  } else if (comision.tasaBase === 'anual' || comision.tasaBase === 'tna') {
    pct = comision.tasa * 100 * (plazo / DIAS_BASE_TNA)
  } else {
    const anual = tasaComparableAnual(comision)
    if (anual == null) return 0
    pct = anual * 100 * (plazo / DIAS_BASE_TNA)
  }

  if (comision.ivaAdicional) pct *= 1 + IVA_COMISION_BROKER
  return pct
}

/**
 * Derecho de mercado prorrateado al plazo (no one-shot completo en 1 día).
 * Usa prorrateoDias del tarifario o 90d BYMA por defecto en cauciones.
 */
export function derechoMercadoPct(
  comision: ComisionCaucionBrokerApi,
  plazo: number,
): number {
  if (comision.derechoMercado == null || !Number.isFinite(comision.derechoMercado)) {
    return 0
  }
  if (!Number.isFinite(plazo) || plazo <= 0) return 0

  const fullPct = comision.derechoMercado * 100
  const diasProrrateo =
    comision.prorrateoDias && comision.prorrateoDias > 0
      ? comision.prorrateoDias
      : comision.producto === 'cauciones'
        ? DIAS_PRORRATEO_DERECHO_DEFAULT
        : DIAS_BASE_TNA

  return fullPct * (Math.min(plazo, diasProrrateo) / diasProrrateo)
}

/**
 * TNA neta de caución con comisiones incluidas.
 * `tasaMercadoTna` viene en puntos porcentuales (p. ej. 18,5 = 18,5% TNA).
 */
export function calcularTasaNetaCaucion(
  tasaMercadoTna: number,
  plazo: number,
  comision: ComisionCaucionBrokerApi | null | undefined,
  operacion: OperacionCaucionFilter = 'colocadora',
): number | null {
  if (!Number.isFinite(tasaMercadoTna) || !Number.isFinite(plazo) || plazo <= 0) {
    return null
  }
  if (!comision) return tasaMercadoTna

  const rendimientoPeriodo = tasaMercadoTna * (plazo / DIAS_BASE_TNA)
  const costoComision = comisionCostoPctPlazo(comision, plazo)
  const costoDerecho = derechoMercadoPct(comision, plazo)
  const costoTotal = costoComision + costoDerecho

  const netoPeriodo =
    operacion === 'tomadora'
      ? rendimientoPeriodo + costoTotal
      : rendimientoPeriodo - costoTotal

  return netoPeriodo * (DIAS_BASE_TNA / plazo)
}
