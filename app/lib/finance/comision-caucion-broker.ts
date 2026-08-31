import { formatPercentAuto } from '../fci-fund-formatters'

export const IVA_COMISION_BROKER = 0.21
export const DIAS_BASE_TNA = 365
/** Convención money-market para comisión mensual publicada. */
export const DIAS_MES_COMISION = 30
/** BYMA cauciones: derecho de mercado suele prorratearse (IOL c/ 90d). */
export const DIAS_PRORRATEO_DERECHO_DEFAULT = 90

export type OperacionBroker =
  | 'colocadora'
  | 'tomadora'
  | 'ambas'
  | 'compra'
  | 'venta'

export type OperacionCaucionBroker = Extract<
  OperacionBroker,
  'colocadora' | 'tomadora' | 'ambas'
>

export type OperacionCaucionFilter = 'colocadora' | 'tomadora'

export type OperacionBrokerFilter =
  | 'all'
  | 'colocadora'
  | 'tomadora'
  | 'compra'
  | 'venta'
  | 'ambas'

export interface ComisionBrokerApi {
  entidad: string
  nombreComercial: string
  producto: string
  operacion: OperacionBroker | string
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

/** @deprecated Usar `ComisionBrokerApi`. */
export type ComisionCaucionBrokerApi = ComisionBrokerApi

export const PRODUCTO_BROKER_LABELS: Record<string, string> = {
  acciones: 'Acciones',
  cedears: 'CEDEARs',
  bonos: 'Bonos',
  obligaciones_negociables: 'Obligaciones negociables',
  letras: 'Letras',
  cauciones: 'Cauciones',
  opciones: 'Opciones',
  futuros: 'Futuros',
  fci: 'FCI',
  cheques: 'Cheques',
  licitaciones: 'Licitaciones',
  alquiler_titulos: 'Alquiler de títulos',
}

/** Orden preferido de productos en chips/filtros. */
export const PRODUCTO_BROKER_ORDER = [
  'cauciones',
  'acciones',
  'cedears',
  'bonos',
  'obligaciones_negociables',
  'letras',
  'opciones',
  'futuros',
  'fci',
  'cheques',
  'licitaciones',
  'alquiler_titulos',
] as const

export const OPERACION_BROKER_LABELS: Record<string, string> = {
  colocadora: 'Colocadora',
  tomadora: 'Tomadora',
  ambas: 'Colocadora y tomadora',
  compra: 'Compra',
  venta: 'Venta',
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
  rookie: 4,
  investor: 5,
  global_markets: 6,
}

export function formatProductoLabel(producto: string | null | undefined): string {
  if (!producto) return '—'
  return PRODUCTO_BROKER_LABELS[producto] ?? producto.replace(/_/g, ' ')
}

export function formatOperacionLabel(operacion: string | null | undefined): string {
  if (!operacion) return '—'
  return OPERACION_BROKER_LABELS[operacion] ?? operacion.replace(/_/g, ' ')
}

/** @deprecated Usar `formatOperacionLabel`. */
export const formatOperacionBrokerLabel = formatOperacionLabel

/** Tasa anual comparable para ordenar (decimal, ej. 0.018 = 1,8% anual). */
export function tasaComparableAnual(row: ComisionBrokerApi): number | null {
  if (typeof row.tasaAnualEquivalente === 'number' && Number.isFinite(row.tasaAnualEquivalente)) {
    return row.tasaAnualEquivalente
  }
  if (row.tasa == null || !Number.isFinite(row.tasa)) return null
  if (row.tasaBase === 'mensual') return row.tasa * 12
  if (row.tasaBase === 'anual' || row.tasaBase === 'tna') return row.tasa
  return row.tasa
}

/**
 * Clave de orden: prioriza `tasaAnualEquivalente` cuando existe;
 * si no, ordena por `tasa` publicada.
 */
export function sortKeyComisionBroker(row: ComisionBrokerApi): number {
  if (
    typeof row.tasaAnualEquivalente === 'number' &&
    Number.isFinite(row.tasaAnualEquivalente)
  ) {
    return row.tasaAnualEquivalente
  }
  if (row.tasa == null || !Number.isFinite(row.tasa)) return Number.POSITIVE_INFINITY
  return row.tasa
}

export function sortComisionesBrokers(rows: ComisionBrokerApi[]): ComisionBrokerApi[] {
  return [...rows].sort((a, b) => {
    const ka = sortKeyComisionBroker(a)
    const kb = sortKeyComisionBroker(b)
    if (ka !== kb) return ka - kb
    const ta = a.tasa ?? Number.POSITIVE_INFINITY
    const tb = b.tasa ?? Number.POSITIVE_INFINITY
    if (ta !== tb) return ta - tb
    return (a.nombreComercial || a.entidad).localeCompare(
      b.nombreComercial || b.entidad,
      'es',
    )
  })
}

export function matchesOperacionFilter(
  operacion: string,
  filter: OperacionCaucionFilter,
): boolean {
  if (operacion === 'ambas') return true
  return operacion === filter
}

export function matchesOperacionBrokerFilter(
  operacion: string,
  filter: OperacionBrokerFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'ambas') return operacion === 'ambas'
  if (operacion === 'ambas') {
    return filter === 'colocadora' || filter === 'tomadora'
  }
  return operacion === filter
}

export function filterComisionesBrokers(
  comisiones: ComisionBrokerApi[] | null | undefined,
  options: {
    producto?: string | 'all'
    moneda?: 'ARS' | 'USD' | 'all'
    operacion?: OperacionBrokerFilter | string
  },
): ComisionBrokerApi[] {
  const filtered = (comisiones ?? []).filter((row) => {
    if (options.producto && options.producto !== 'all' && row.producto !== options.producto) {
      return false
    }
    if (options.moneda && options.moneda !== 'all' && row.moneda !== options.moneda) {
      return false
    }
    const op = options.operacion ?? 'all'
    if (op !== 'all' && !matchesOperacionBrokerFilter(row.operacion, op as OperacionBrokerFilter)) {
      return false
    }
    return true
  })

  return sortComisionesBrokers(filtered)
}

export function formatTasaPublicada(row: ComisionBrokerApi): string {
  if (row.tasa == null || !Number.isFinite(row.tasa)) return 'Consultar'

  const pct = row.tasa * 100
  const formatted = formatPercentAuto(pct)
  const base = row.tasaBase ? TASA_BASE_LABELS[row.tasaBase] ?? row.tasaBase : null
  const prefix = row.tasaEsTope ? 'Hasta ' : ''

  if (base) return `${prefix}${formatted} ${base}`
  return `${prefix}${formatted}`
}

export function hasTasaAnualComparable(row: ComisionBrokerApi): boolean {
  if (
    typeof row.tasaAnualEquivalente === 'number' &&
    Number.isFinite(row.tasaAnualEquivalente)
  ) {
    return true
  }
  return row.tasaBase === 'mensual' || row.tasaBase === 'anual' || row.tasaBase === 'tna'
}

export function formatTasaAnualComparable(row: ComisionBrokerApi): string {
  if (!hasTasaAnualComparable(row)) return '—'
  const anual = tasaComparableAnual(row)
  if (anual == null) return '—'
  return `${formatPercentAuto(anual * 100)} anual equiv.`
}

/** Membresía/plan en moneda de la fila, p. ej. "$5.000/mes + IVA". */
export function formatMembresiaMensual(
  row: Pick<ComisionBrokerApi, 'membresiaMensual' | 'membresiaIvaAdicional' | 'moneda'>,
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
  rows: ComisionBrokerApi[],
): ComisionBrokerApi[] {
  const byEntidad = new Map<string, ComisionBrokerApi[]>()

  for (const row of rows) {
    const list = byEntidad.get(row.entidad) ?? []
    list.push(row)
    byEntidad.set(row.entidad, list)
  }

  const picked: ComisionBrokerApi[] = []

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
  comisiones: ComisionBrokerApi[] | null | undefined,
  options: {
    moneda: 'ARS' | 'USD'
    operacion: OperacionCaucionFilter
    dedupePorEntidad?: boolean
  },
): ComisionBrokerApi[] {
  const filtered = (comisiones ?? []).filter(
    (row) =>
      row.producto === 'cauciones' &&
      row.moneda === options.moneda &&
      matchesOperacionFilter(row.operacion, options.operacion),
  )

  if (options.dedupePorEntidad === false) {
    return sortComisionesBrokers(filtered)
  }

  return pickBestComisionPorEntidad(filtered)
}

/** Mejor fila de comisión para un broker, moneda y rol. */
export function getComisionBroker(
  comisiones: ComisionBrokerApi[] | null | undefined,
  entidad: string,
  moneda: 'ARS' | 'USD',
  operacion: OperacionCaucionFilter,
): ComisionBrokerApi | null {
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
  comision: ComisionBrokerApi,
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
  comision: ComisionBrokerApi,
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
  comision: ComisionBrokerApi | null | undefined,
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
