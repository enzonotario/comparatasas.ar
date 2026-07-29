/**
 * Poder de compra del dólar medido en UVA: cuántas UVA compra un dólar.
 *
 * ratio = dólar_venta_ARS / UVA_ARS
 *
 * Por encima del promedio histórico suele interpretarse UVA “barata” (buen momento
 * relativo para cancelar deuda). Por debajo, UVA “cara” (buen momento relativo para
 * endeudarse). Es un indicador histórico, no una recomendación.
 */

export interface DatedValue {
  fecha: string
  valor: number
}

export interface UvaDolarPoderCompraPoint {
  fecha: string
  /** UVAs por 1 USD (venta de la casa elegida) */
  ratio: number
  uva: number
  dolarVenta: number
}

export type UvaDolarSenal = 'cancelar' | 'endeudarse' | 'neutro'

export interface UvaDolarPoderCompraSeries {
  points: UvaDolarPoderCompraPoint[]
  promedioHistorico: number
  maximo: UvaDolarPoderCompraPoint | null
  ultimo: UvaDolarPoderCompraPoint | null
  senal: UvaDolarSenal
}

function toYmd(fecha: string): string {
  return fecha.slice(0, 10)
}

function sortByFechaAsc<T extends { fecha: string }>(rows: ReadonlyArray<T>): T[] {
  return [...rows].sort((a, b) => toYmd(a.fecha).localeCompare(toYmd(b.fecha)))
}

/** Último valor con fecha ≤ target (serie ordenada ascendente). */
export function resolveDatedValueAtOrBefore(
  sortedAsc: ReadonlyArray<DatedValue>,
  targetYmd: string,
): number | null {
  if (sortedAsc.length === 0) return null
  const target = toYmd(targetYmd)
  let lo = 0
  let hi = sortedAsc.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const row = sortedAsc[mid]
    if (!row) break
    const f = toYmd(row.fecha)
    if (f <= target) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (ans < 0) return null
  return sortedAsc[ans]?.valor ?? null
}

export function buildUvaDolarPoderCompraSeries(
  uvaRows: ReadonlyArray<DatedValue>,
  dolarRows: ReadonlyArray<DatedValue>,
): UvaDolarPoderCompraSeries {
  const uvaAsc = sortByFechaAsc(uvaRows)
  const dolarAsc = sortByFechaAsc(dolarRows)

  const points: UvaDolarPoderCompraPoint[] = []
  for (const uva of uvaAsc) {
    if (!Number.isFinite(uva.valor) || uva.valor <= 0) continue
    const fecha = toYmd(uva.fecha)
    const dolarVenta = resolveDatedValueAtOrBefore(dolarAsc, fecha)
    if (dolarVenta == null || !Number.isFinite(dolarVenta) || dolarVenta <= 0) continue
    points.push({
      fecha,
      ratio: dolarVenta / uva.valor,
      uva: uva.valor,
      dolarVenta,
    })
  }

  if (points.length === 0) {
    return {
      points: [],
      promedioHistorico: 0,
      maximo: null,
      ultimo: null,
      senal: 'neutro',
    }
  }

  const promedioHistorico = points.reduce((s, p) => s + p.ratio, 0) / points.length
  const maximo = points.reduce((best, p) => (p.ratio > best.ratio ? p : best), points[0]!)
  const ultimo = points[points.length - 1]!

  const tolerancia = promedioHistorico * 0.02
  let senal: UvaDolarSenal = 'neutro'
  if (ultimo.ratio > promedioHistorico + tolerancia) senal = 'cancelar'
  else if (ultimo.ratio < promedioHistorico - tolerancia) senal = 'endeudarse'

  return {
    points,
    promedioHistorico,
    maximo,
    ultimo,
    senal,
  }
}

export function formatUvaDolarRatio(value: number, digits = 2): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
