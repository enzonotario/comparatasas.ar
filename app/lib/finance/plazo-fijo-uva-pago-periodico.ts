/**
 * Plazo fijo UVA precancelable — evolución temporal y contrafactual histórico.
 *
 * **Eje temporal:** desde la fecha de colocación (última cotización UVA menos el plazo en días del
 * simulador) hasta la última fecha con índice UVA disponible (“hoy” en datos).
 *
 * **Vencimiento (UVA + TNA adicional), por día t:** P × (UVA_t/UVA_inicio) × (1 + TNA_adicional/365)^d,
 * alineado a `useInvestmentSimulator` (interés **compuesto** diario sobre la TNA adicional).
 *
 * **Precancelación:** solo TNA de precancelación **simple** sobre el nominal: P × (1 + TNA_prec × d/365).
 *
 * Si el bruto prec. supera al vencimiento UVA+TNA, se muestra por debajo del azul con
 * `min(R, M × factor)` (factor < 1, levemente distinto según TNA prec.), sin bajar del capital inicial.
 *
 * Resolución de UVA: último valor con fecha ≤ fecha objetivo (serie ordenada ascendente).
 */

export const UVA_HISTORY_DAYS_PER_YEAR = 365

export interface UvaIndexRow {
  fecha: string
  valor: number
}

/** Resta días calendario a una fecha YYYY-MM-DD (ancla mediodía UTC). */
export function subtractCalendarDaysYmd(endYmd: string, days: number): string {
  const d = new Date(`${endYmd.slice(0, 10)}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Suma días calendario a una fecha YYYY-MM-DD (ancla mediodía UTC). */
export function addCalendarDaysYmd(startYmd: string, days: number): string {
  const d = new Date(`${startYmd.slice(0, 10)}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Días corridos UTC entre dos fechas (inicio ≤ fin). */
export function calendarDaysBetweenUtc(startYmd: string, endYmd: string): number {
  const a = new Date(`${startYmd.slice(0, 10)}T12:00:00.000Z`).getTime()
  const b = new Date(`${endYmd.slice(0, 10)}T12:00:00.000Z`).getTime()
  return Math.round((b - a) / 86400000)
}

/**
 * Último valor UVA con fecha ≤ target (búsqueda binaria; `sortedAsc` ordenado por `fecha`).
 */
export function resolveUvaValueAtOrBefore(
  sortedAsc: ReadonlyArray<UvaIndexRow>,
  targetYmd: string,
): number | null {
  if (sortedAsc.length === 0) return null
  const target = targetYmd.slice(0, 10)
  let lo = 0
  let hi = sortedAsc.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const row = sortedAsc[mid]
    if (!row) break
    const f = row.fecha.slice(0, 10)
    if (f <= target) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (ans < 0) return null
  const chosen = sortedAsc[ans]
  return chosen ? chosen.valor : null
}

export function sortUvaByDateAsc(rows: ReadonlyArray<UvaIndexRow>): UvaIndexRow[] {
  return [...rows].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Interés simple anual: factor = 1 + r × d/365 */
export function factorInteresSimpleAnual(tnaAnualFraccion: number, dias: number): number {
  return 1 + (tnaAnualFraccion * dias) / UVA_HISTORY_DAYS_PER_YEAR
}

/** Factor de interés compuesto diario (simulador del sitio). */
export function factorInteresAdicionalCompuestoDiario(
  tnaAdicionalAnualFraccion: number,
  dias: number,
): number {
  const daily = tnaAdicionalAnualFraccion / UVA_HISTORY_DAYS_PER_YEAR
  return Math.pow(1 + daily, dias)
}

/** Factor total en un solo tramo: (UVA_fin / UVA_inicio) × TNA adicional compuesta (tests / utilidad). */
export function factorTotalContrafactualUva(
  uvaInicio: number,
  uvaFin: number,
  tnaAdicionalAnualFraccion: number,
  dias: number,
): number {
  if (uvaInicio <= 0 || uvaFin <= 0) return NaN
  const fUva = uvaFin / uvaInicio
  const fInt = factorInteresAdicionalCompuestoDiario(tnaAdicionalAnualFraccion, dias)
  return fUva * fInt
}

export function tnaNominalAnualDesdeFactorPeriodo(factorPeriodo: number, dias: number): number {
  if (dias <= 0 || !Number.isFinite(factorPeriodo) || factorPeriodo <= 0) return NaN
  return Math.pow(factorPeriodo, UVA_HISTORY_DAYS_PER_YEAR / dias) - 1
}

/** Monto en pesos al día t: UVA × TNA adicional compuesta (365), coherente con el simulador del sitio. */
export function montoVencimientoUva(
  montoInicial: number,
  uvaInicio: number,
  uvaEnFecha: number,
  diasDesdeInicio: number,
  tnaAdicionalAnualFraccion: number,
): number {
  if (uvaInicio <= 0 || uvaEnFecha <= 0 || montoInicial <= 0) return NaN
  const fUva = uvaEnFecha / uvaInicio
  const fInt = factorInteresAdicionalCompuestoDiario(tnaAdicionalAnualFraccion, diasDesdeInicio)
  return montoInicial * fUva * fInt
}

export function montoPrecancelacionSimple(
  montoInicial: number,
  diasDesdeInicio: number,
  tnaPrecancelacionAnualFraccion: number,
): number {
  return montoInicial * factorInteresSimpleAnual(tnaPrecancelacionAnualFraccion, diasDesdeInicio)
}

/**
 * Vista comparativa: precancelación no por encima de UVA+TNA; nunca por debajo del capital inicial.
 * Si R > M: `min(R, M × (0,999 − 0,02 × TNA_prec))` (acotado) en lugar de M²/R (que podía ser < P).
 */
export function montoPrecancelacionCotejadoBajoVencimiento(
  montoVencimientoUva: number,
  montoPrecancelacionBruto: number | null,
  capitalInicial: number,
  tnaPrecancelacionAnualFraccion: number | null,
): number | null {
  if (montoPrecancelacionBruto == null) return null
  const M = montoVencimientoUva
  const R = montoPrecancelacionBruto
  const tnaP = tnaPrecancelacionAnualFraccion ?? 0
  let x: number
  if (R <= M) {
    x = R
  } else {
    const factorM = Math.max(0.94, 0.999 - 0.02 * Math.min(tnaP, 1))
    x = Math.min(R, M * factorM)
  }
  return Math.max(capitalInicial, x)
}

export interface PrecancelableTimelinePoint {
  /** Fecha del punto (YYYY-MM-DD) */
  fechaYmd: string
  /** Días corridos desde la colocación */
  diasDesdeInicio: number
  montoFinalUva: number
  /** Ajustado para la vista: nunca por encima de `montoFinalUva` (ver cabecera del módulo). */
  montoFinalPrecancelacion: number | null
}

export interface BuildPrecancelableUvaTimelineSeriesOptions {
  uvaSortedAsc: ReadonlyArray<UvaIndexRow>
  montoInicial: number
  /** Fecha de colocación (inicio del depósito) */
  fechaInicioYmd: string
  /** Última fecha con UVA (típicamente última fila de la API) */
  fechaFinYmd: string
  tnaAdicionalAnualFraccion: number
  tnaPrecancelacionAnualFraccion: number | null
  /** 1 = un punto por día; mayor = menos puntos */
  stepDias?: number
}

/**
 * Serie día a día (o cada `stepDias`) desde colocación hasta fecha fin.
 * Si `fechaInicioYmd` es anterior al primer UVA disponible, se recorta al primer día con dato.
 */
export function buildPrecancelableUvaTimelineSeries(
  options: BuildPrecancelableUvaTimelineSeriesOptions,
): PrecancelableTimelinePoint[] {
  const {
    uvaSortedAsc,
    montoInicial,
    fechaInicioYmd: fechaInicioRaw,
    fechaFinYmd,
    tnaAdicionalAnualFraccion,
    tnaPrecancelacionAnualFraccion,
    stepDias = 1,
  } = options

  if (
    uvaSortedAsc.length === 0 ||
    !Number.isFinite(montoInicial) ||
    montoInicial <= 0 ||
    stepDias < 1
  ) {
    return []
  }

  const firstRow = uvaSortedAsc[0]
  const lastRow = uvaSortedAsc[uvaSortedAsc.length - 1]
  if (!firstRow || !lastRow) return []

  const firstYmd = firstRow.fecha.slice(0, 10)
  let fechaInicioYmd = fechaInicioRaw.slice(0, 10)
  if (fechaInicioYmd < firstYmd) {
    fechaInicioYmd = firstYmd
  }

  const fin = fechaFinYmd.slice(0, 10)
  if (fin < fechaInicioYmd) return []

  const uva0 = resolveUvaValueAtOrBefore(uvaSortedAsc, fechaInicioYmd)
  if (uva0 == null || uva0 <= 0) return []

  const totalDays = calendarDaysBetweenUtc(fechaInicioYmd, fin)
  const out: PrecancelableTimelinePoint[] = []

  function pushPoint(cursorYmd: string, d: number) {
    const uvaT = resolveUvaValueAtOrBefore(uvaSortedAsc, cursorYmd)
    if (uvaT == null || uvaT <= 0) return

    const montoFinalUva = montoVencimientoUva(
      montoInicial,
      uva0,
      uvaT,
      d,
      tnaAdicionalAnualFraccion,
    )
    if (!Number.isFinite(montoFinalUva)) return

    let montoFinalPrecancelacion: number | null = null
    if (tnaPrecancelacionAnualFraccion != null && Number.isFinite(tnaPrecancelacionAnualFraccion)) {
      const bruto = montoPrecancelacionSimple(montoInicial, d, tnaPrecancelacionAnualFraccion)
      montoFinalPrecancelacion = montoPrecancelacionCotejadoBajoVencimiento(
        montoFinalUva,
        bruto,
        montoInicial,
        tnaPrecancelacionAnualFraccion,
      )
    }

    out.push({
      fechaYmd: cursorYmd,
      diasDesdeInicio: d,
      montoFinalUva,
      montoFinalPrecancelacion,
    })
  }

  for (let i = 0; i <= totalDays; i += stepDias) {
    const cursorYmd = addCalendarDaysYmd(fechaInicioYmd, i)
    if (cursorYmd > fin) break
    pushPoint(cursorYmd, i)
  }

  if (totalDays > 0 && totalDays % stepDias !== 0) {
    pushPoint(fin, totalDays)
  }

  return out
}
