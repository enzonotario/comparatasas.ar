/**
 * Simulación de préstamos personales con sistema francés.
 * La TNA/TEA/CFT llegan en puntos porcentuales (74 = 74%).
 */

export function parseAfectacionIngresosPercent(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }
  const match = String(value)
    .replace(',', '.')
    .match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/** Tasa mensual nominal a partir de TNA en %. */
export function monthlyRateFromTnaPercent(tnaPercent: number): number {
  return tnaPercent / 100 / 12
}

/** Tasa mensual efectiva a partir de TEA/CFT TEA en %. */
export function monthlyRateFromTeaPercent(teaPercent: number): number {
  return Math.pow(1 + teaPercent / 100, 1 / 12) - 1
}

/** Cuota fija (sistema francés). */
export function frenchAmortizationPayment(
  principal: number,
  monthlyRate: number,
  periods: number,
): number {
  if (!Number.isFinite(principal) || principal <= 0) return NaN
  if (!Number.isFinite(periods) || periods < 1) return NaN
  if (!Number.isFinite(monthlyRate)) return NaN
  if (Math.abs(monthlyRate) < 1e-12) return principal / periods

  const factor = Math.pow(1 + monthlyRate, periods)
  return (principal * (monthlyRate * factor)) / (factor - 1)
}

export interface TasaPorPlazo {
  plazoMinMeses?: number
  plazoMaxMeses?: number
  tna?: number | null
  tea?: number | null
  cftTea?: number | null
}

/**
 * Devuelve el tramo cuyo rango de meses contiene `months`, o null si no hay match.
 */
export function pickTasasPorPlazo(
  tasasPorPlazo: TasaPorPlazo[] | null | undefined,
  months: number,
): TasaPorPlazo | null {
  if (!tasasPorPlazo?.length || !Number.isFinite(months)) return null
  const m = Math.round(months)
  return (
    tasasPorPlazo.find((tramo) => {
      const min = tramo.plazoMinMeses
      const max = tramo.plazoMaxMeses
      if (min == null || max == null) return false
      return m >= min && m <= max
    }) ?? null
  )
}

export interface BestRatesFromTasasPorPlazo {
  tna: number | null
  tea: number | null
  cftTea: number | null
}

/**
 * Menores TNA/TEA/CFT TEA entre tramos (para ranking sin simulación).
 * Los tramos individuales siguen mostrando el detalle de rangos.
 */
export function bestRatesFromTasasPorPlazo(
  tasasPorPlazo: TasaPorPlazo[] | null | undefined,
): BestRatesFromTasasPorPlazo | null {
  if (!tasasPorPlazo?.length) return null

  let tna: number | null = null
  let tea: number | null = null
  let cftTea: number | null = null

  for (const tramo of tasasPorPlazo) {
    if (tramo.tna != null && Number.isFinite(tramo.tna)) {
      tna = tna == null ? tramo.tna : Math.min(tna, tramo.tna)
    }
    if (tramo.tea != null && Number.isFinite(tramo.tea)) {
      tea = tea == null ? tramo.tea : Math.min(tea, tramo.tea)
    }
    if (tramo.cftTea != null && Number.isFinite(tramo.cftTea)) {
      cftTea = cftTea == null ? tramo.cftTea : Math.min(cftTea, tramo.cftTea)
    }
  }

  if (tna == null && tea == null && cftTea == null) return null
  return { tna, tea, cftTea }
}

export interface SimulatePrestamoPersonalInput {
  amount: number
  months: number
  /** TNA en puntos porcentuales (ej. 74). */
  tnaPercent: number | null
  /** CFT TEA en puntos porcentuales (ej. 171.76). */
  cftTeaPercent?: number | null
  /** Tope de cuota vs ingresos, ej. "30%" o 30. */
  afectacionIngresos?: string | number | null
  /** Ingresos netos mensuales; si falta, no se valida tope. */
  income?: number | null
  /** Plazo de ejemplo publicado por el banco (meses). */
  plazoMesesEjemplo?: number | null
  /**
   * Tasas por tramo (ya en %). Si hay lista no vacía y ningún tramo cubre el plazo,
   * la simulación queda fuera de rango.
   */
  tasasPorPlazo?: TasaPorPlazo[] | null
}

export interface SimulatePrestamoPersonalResult {
  cuota: number | null
  total: number | null
  interes: number | null
  /** Cuota aproximada usando CFT TEA (incluye IVA/cargos en la tasa). */
  cuotaCft: number | null
  totalCft: number | null
  /** TNA efectiva usada (tramo o root), en %. */
  tnaUsada: number | null
  /** CFT TEA efectivo usado (tramo o root), en %. */
  cftTeaUsada: number | null
  afectacionPercent: number | null
  maxCuotaByIncome: number | null
  exceedsIncomeCap: boolean
  plazoEjemplo: number | null
  plazoDifiereDeEjemplo: boolean
  /** Hay tablas por plazo pero el plazo pedido no cae en ningún tramo. */
  plazoFueraDeRango: boolean
}

export function simulatePrestamoPersonal(
  input: SimulatePrestamoPersonalInput,
): SimulatePrestamoPersonalResult {
  const { amount, months } = input
  const afectacionPercent = parseAfectacionIngresosPercent(input.afectacionIngresos)
  const income =
    input.income != null && Number.isFinite(input.income) && input.income > 0 ? input.income : null
  const maxCuotaByIncome =
    income != null && afectacionPercent != null ? (income * afectacionPercent) / 100 : null

  const plazoEjemplo =
    input.plazoMesesEjemplo != null &&
    Number.isFinite(input.plazoMesesEjemplo) &&
    input.plazoMesesEjemplo > 0
      ? Math.round(input.plazoMesesEjemplo)
      : null

  const hasTasasPorPlazo = Array.isArray(input.tasasPorPlazo) && input.tasasPorPlazo.length > 0
  const tramo = hasTasasPorPlazo ? pickTasasPorPlazo(input.tasasPorPlazo, months) : null
  const plazoFueraDeRango = hasTasasPorPlazo && tramo == null

  let tnaPercent = input.tnaPercent
  let cftTeaPercent = input.cftTeaPercent ?? null

  if (tramo) {
    if (tramo.tna != null && Number.isFinite(tramo.tna)) tnaPercent = tramo.tna
    if (tramo.cftTea != null && Number.isFinite(tramo.cftTea)) cftTeaPercent = tramo.cftTea
  }

  let cuota: number | null = null
  let total: number | null = null
  let interes: number | null = null
  let cuotaCft: number | null = null
  let totalCft: number | null = null

  if (!plazoFueraDeRango) {
    if (tnaPercent != null && Number.isFinite(tnaPercent) && tnaPercent >= 0) {
      const payment = frenchAmortizationPayment(
        amount,
        monthlyRateFromTnaPercent(tnaPercent),
        months,
      )
      if (Number.isFinite(payment)) {
        cuota = payment
        total = payment * months
        interes = total - amount
      }
    }

    if (cftTeaPercent != null && Number.isFinite(cftTeaPercent) && cftTeaPercent >= 0) {
      const payment = frenchAmortizationPayment(
        amount,
        monthlyRateFromTeaPercent(cftTeaPercent),
        months,
      )
      if (Number.isFinite(payment)) {
        cuotaCft = payment
        totalCft = payment * months
      }
    }
  }

  const cuotaParaTope = cuotaCft ?? cuota
  const exceedsIncomeCap =
    maxCuotaByIncome != null && cuotaParaTope != null && cuotaParaTope > maxCuotaByIncome + 1e-6

  return {
    cuota,
    total,
    interes,
    cuotaCft,
    totalCft,
    tnaUsada: plazoFueraDeRango ? null : (tnaPercent ?? null),
    cftTeaUsada: plazoFueraDeRango ? null : (cftTeaPercent ?? null),
    afectacionPercent,
    maxCuotaByIncome,
    exceedsIncomeCap,
    plazoEjemplo,
    plazoDifiereDeEjemplo: !hasTasasPorPlazo && plazoEjemplo != null && plazoEjemplo !== months,
    plazoFueraDeRango,
  }
}

/** Tope BCRA típico de cuota vs ingreso (Capitales Mínimos 2.8.3.4). */
export const BCRA_CUOTA_INGRESO_MAX_RATIO = 0.3

export type CuotaIngresoRisk = 'optimo' | 'aceptable' | 'alerta' | 'riesgo'

export type AumentoSalarialFrecuencia = 'anual' | 'semestral' | 'trimestral'

export function cuotaIngresoRatioPercent(cuota: number, income: number): number | null {
  if (!Number.isFinite(cuota) || !Number.isFinite(income) || income <= 0) return null
  return (cuota / income) * 100
}

export function classifyCuotaIngreso(ratioPercent: number): CuotaIngresoRisk {
  if (ratioPercent < 20) return 'optimo'
  if (ratioPercent < 30) return 'aceptable'
  if (ratioPercent < 40) return 'alerta'
  return 'riesgo'
}

/** Ingreso neto mensual mínimo para que la cuota no supere el tope (default 30%). */
export function ingresoRequeridoParaCuota(
  cuota: number,
  maxRatio = BCRA_CUOTA_INGRESO_MAX_RATIO,
): number | null {
  if (!Number.isFinite(cuota) || cuota <= 0 || maxRatio <= 0) return null
  return cuota / maxRatio
}

export interface CuotaIngresoProjectionRow {
  label: string
  yearIndex: number
  ingresoMensual: number
  cuotaMensual: number
  /** Cuota deflactada a poder de compra de hoy (si hay inflación anual). */
  cuotaPoderCompraHoy: number
  ratioPercent: number
  risk: CuotaIngresoRisk
}

function aumentosPorAnio(frecuencia: AumentoSalarialFrecuencia): number {
  if (frecuencia === 'trimestral') return 4
  if (frecuencia === 'semestral') return 2
  return 1
}

/**
 * Proyecta relación cuota/ingreso año a año (cuota fija nominal; ingresos con aumentos).
 * `remInflacionAnualPercent` deflacta la cuota a $ de hoy (opcional).
 */
export function projectCuotaIngresoByYear(options: {
  months: number
  cuota: number
  income: number
  aumentoAnualPercent: number
  frecuencia: AumentoSalarialFrecuencia
  /** Si true, no aplica aumentos (escenario de estrés). */
  sinAumento?: boolean
  remInflacionAnualPercent?: number | null
}): CuotaIngresoProjectionRow[] {
  const { months, cuota, income } = options
  if (
    !Number.isFinite(months) ||
    months < 1 ||
    !Number.isFinite(cuota) ||
    !Number.isFinite(income) ||
    income <= 0
  ) {
    return []
  }

  const years = Math.ceil(months / 12)
  const rem =
    options.remInflacionAnualPercent != null && Number.isFinite(options.remInflacionAnualPercent)
      ? options.remInflacionAnualPercent / 100
      : 0
  const aumento = options.sinAumento ? 0 : Math.max(0, options.aumentoAnualPercent) / 100
  const periodsPerYear = aumentosPorAnio(options.frecuencia)
  const periodRate = aumento > 0 ? Math.pow(1 + aumento, 1 / periodsPerYear) - 1 : 0

  const rows: CuotaIngresoProjectionRow[] = []
  for (let year = 0; year < years; year++) {
    const periodsElapsed = year * periodsPerYear
    const ingresoMensual = income * Math.pow(1 + periodRate, periodsElapsed)
    const cuotaPoderCompraHoy = rem > 0 ? cuota / Math.pow(1 + rem, year) : cuota
    const ratioPercent = (cuota / ingresoMensual) * 100
    rows.push({
      label: year === 0 ? 'Actual (hoy)' : `Año ${year + 1}`,
      yearIndex: year,
      ingresoMensual,
      cuotaMensual: cuota,
      cuotaPoderCompraHoy,
      ratioPercent,
      risk: classifyCuotaIngreso(ratioPercent),
    })
  }
  return rows
}

export type CftVsRemRisk = 'bajo' | 'moderado' | 'alto' | 'extremo'

export interface CftVsRemComparison {
  cftPercent: number
  remPercent: number
  /** CFT ÷ REM (veces la inflación esperada). */
  multiple: number
  risk: CftVsRemRisk
}

/**
 * Compara CFT TEA anual vs inflación REM esperada a 12 meses (como en Profit).
 * Umbrales orientativos: <2x bajo, <3x moderado, <5x alto, ≥5x extremo.
 */
export function compareCftVsRem(cftPercent: number, remPercent: number): CftVsRemComparison | null {
  if (
    !Number.isFinite(cftPercent) ||
    !Number.isFinite(remPercent) ||
    cftPercent < 0 ||
    remPercent <= 0
  ) {
    return null
  }

  const multiple = cftPercent / remPercent
  let risk: CftVsRemRisk
  if (multiple < 2) risk = 'bajo'
  else if (multiple < 3) risk = 'moderado'
  else if (multiple < 5) risk = 'alto'
  else risk = 'extremo'

  return { cftPercent, remPercent, multiple, risk }
}
