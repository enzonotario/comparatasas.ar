/** Días desde el último reporte CNV para considerar un fondo activo. */
export const FUND_ACTIVE_REPORT_MAX_AGE_DAYS = 30

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Un fondo está activo si su última fecha de planilla cae dentro
 * de `FUND_ACTIVE_REPORT_MAX_AGE_DAYS` (incluye feriados/fines de semana).
 */
export function isFundReportActive(
  fecha: string | null | undefined,
  {
    now = new Date(),
    maxAgeDays = FUND_ACTIVE_REPORT_MAX_AGE_DAYS,
  }: { now?: Date; maxAgeDays?: number } = {},
) {
  if (!fecha || !ISO_DATE.test(fecha)) return false

  const reportedAt = Date.parse(`${fecha}T00:00:00`)
  if (!Number.isFinite(reportedAt)) return false

  const ageMs = startOfLocalDay(now) - reportedAt
  if (ageMs < 0) return true

  return ageMs <= maxAgeDays * 24 * 60 * 60 * 1000
}
