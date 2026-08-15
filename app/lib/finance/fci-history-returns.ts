/** Máximo ratio VCP permitido en una ventana corta (evita seeds VCP=1 vs ~1000). */
export const MAX_VCP_LOOKBACK_RATIO = 2
const LOOKBACK_TOLERANCE_DAYS = 4

/** Umbral para descartar TNA/rendimientos absurdos ya persistidos en API. */
export const MAX_PLAUSIBLE_ANNUALIZED_RETURN_PCT = 1000

export type FciHistoryVcpPoint = {
  fecha: string
  valorCuotaparte: number | null | undefined
}

function daysBetween(fromDate: string, toDate: string) {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`)
  const to = Date.parse(`${toDate}T00:00:00.000Z`)

  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return null
  }

  return Math.round((to - from) / (24 * 60 * 60 * 1000))
}

export function annualizeReturnPercent(vcpNew: number, vcpOld: number, days: number) {
  if (!(vcpOld > 0) || !(vcpNew > 0) || !(days > 0)) return null

  const periodReturn = (vcpNew - vcpOld) / vcpOld
  return Number(((periodReturn / days) * 365 * 100).toFixed(4))
}

export function isPlausibleVcpPair(vcpNew: number, vcpOld: number) {
  if (!(vcpNew > 0) || !(vcpOld > 0)) return false

  const ratio = vcpNew / vcpOld
  return ratio >= 1 / MAX_VCP_LOOKBACK_RATIO && ratio <= MAX_VCP_LOOKBACK_RATIO
}

export function sanitizeAnnualizedReturnPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null
  if (Math.abs(value) > MAX_PLAUSIBLE_ANNUALIZED_RETURN_PCT) return null
  return value
}

/** Filtra puntos seed (p. ej. VCP=1) inconsistentes con el VCP más reciente. */
export function filterPlausibleHistoryPoints<T extends FciHistoryVcpPoint>(points: T[]) {
  const sorted = [...points]
    .filter((item) => item?.fecha && item.valorCuotaparte != null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha)) as Array<T & { valorCuotaparte: number }>

  if (!sorted.length) return []

  const latest = sorted[sorted.length - 1]
  return sorted.filter((item) => isPlausibleVcpPair(latest.valorCuotaparte, item.valorCuotaparte))
}

export function recomputeHistoryReturns<T extends FciHistoryVcpPoint>(points: T[]) {
  const cleaned = filterPlausibleHistoryPoints(points)
  if (!cleaned.length) return []

  const firstVcp = cleaned[0].valorCuotaparte

  return cleaned.map((item, index) => {
    const previous = index > 0 ? cleaned[index - 1] : null
    const retornoDiario =
      previous && previous.valorCuotaparte > 0
        ? Number(
            (
              ((item.valorCuotaparte - previous.valorCuotaparte) / previous.valorCuotaparte) *
              100
            ).toFixed(6),
          )
        : null

    const retornoAcumulado =
      firstVcp > 0
        ? Number((((item.valorCuotaparte - firstVcp) / firstVcp) * 100).toFixed(6))
        : null

    return {
      ...item,
      retornoDiario,
      retornoAcumulado,
    }
  })
}

export function computeRendimientosFromHistory(input: {
  fecha: string | null | undefined
  valorCuotaparte: number | null | undefined
  variacionDiariaPct?: number | null
  history?: FciHistoryVcpPoint[]
}) {
  const { fecha, valorCuotaparte, variacionDiariaPct = null, history = [] } = input

  const sorted = filterPlausibleHistoryPoints(history)

  const findNear = (targetDays: number) => {
    if (!fecha || valorCuotaparte == null) return null

    const targetTime = Date.parse(`${fecha}T00:00:00.000Z`) - targetDays * 24 * 60 * 60 * 1000

    let best: (FciHistoryVcpPoint & { valorCuotaparte: number }) | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const item of sorted) {
      if (item.fecha >= fecha) continue

      const itemTime = Date.parse(`${item.fecha}T00:00:00.000Z`)
      const distance = Math.abs(itemTime - targetTime)

      if (distance < bestDistance) {
        best = item
        bestDistance = distance
      }
    }

    if (!best || bestDistance > LOOKBACK_TOLERANCE_DAYS * 24 * 60 * 60 * 1000) {
      return null
    }

    const days = daysBetween(best.fecha, fecha)
    if (!days || days < targetDays - LOOKBACK_TOLERANCE_DAYS) {
      return null
    }

    return {
      days,
      value: annualizeReturnPercent(valorCuotaparte, best.valorCuotaparte, days),
    }
  }

  const seven = findNear(7)
  const thirty = findNear(30)

  const fromDaily =
    typeof variacionDiariaPct === 'number' ? Number((variacionDiariaPct * 365).toFixed(4)) : null

  return {
    valorCuotaparte: valorCuotaparte ?? null,
    ultimos7Dias: seven?.value ?? fromDaily,
    unMes: thirty?.value ?? seven?.value ?? fromDaily,
    sevenDays: seven?.days ?? null,
    thirtyDays: thirty?.days ?? null,
  }
}
