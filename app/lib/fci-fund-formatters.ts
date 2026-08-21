export function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeCurrencyLabel(currency: string | null | undefined) {
  return (currency || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function normalizeCurrencyCode(currency: string | null | undefined) {
  const normalized = normalizeCurrencyLabel(currency)

  if (!normalized) return 'ARS'

  if (
    normalized === 'ars' ||
    normalized === 'peso argentina' ||
    normalized === 'peso argentino' ||
    normalized === 'pesos argentinos' ||
    normalized === 'pesos argentino'
  ) {
    return 'ARS'
  }

  if (
    normalized === 'usd' ||
    normalized === 'usb' || // typo frecuente en CNV
    normalized === 'u$s' ||
    normalized === 'dolar estadounidense' ||
    normalized === 'dolar estadounidense billete' ||
    normalized === 'dolar estadounidense cable'
  ) {
    return 'USD'
  }

  const upper = currency?.trim().toUpperCase()
  if (upper === 'ARS' || upper === 'USD') return upper

  return 'ARS'
}

export function formatCurrency(value: number | null | undefined, currency = 'ARS') {
  if (value == null || !Number.isFinite(value)) return '—'
  const safeCurrency = normalizeCurrencyCode(currency)

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value)
  }
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function isUsdCurrency(currency: string | null | undefined) {
  return normalizeCurrencyCode(currency) === 'USD'
}

/** Convierte un monto en moneda del fondo a ARS (dólar bolsa / MEP). */
export function toArsPatrimonio(
  value: number | null | undefined,
  currency: string | null | undefined,
  usdArsRate: number | null | undefined,
) {
  if (value == null || !Number.isFinite(value)) return null
  if (!isUsdCurrency(currency)) return value
  if (usdArsRate == null || !Number.isFinite(usdArsRate) || usdArsRate <= 0) return null
  return value * usdArsRate
}

/** Compacto con sufijo USD cuando corresponde. */
export function formatCompactPatrimonio(
  value: number | null | undefined,
  currency?: string | null,
) {
  const formatted = formatCompactNumber(value)
  if (formatted === '—') return formatted
  if (isUsdCurrency(currency)) return `${formatted} USD`
  return formatted
}

/** Hint de equivalente ARS vía dólar bolsa (MEP) para patrimonios en USD. */
export function formatArsEquivalentHint(
  value: number | null | undefined,
  currency: string | null | undefined,
  usdArsRate: number | null | undefined,
) {
  if (!isUsdCurrency(currency)) return null
  const ars = toArsPatrimonio(value, currency, usdArsRate)
  if (ars == null) return null
  return `≈ ${formatCompactNumber(ars)} ARS`
}

export function formatDecimal(value: number | null | undefined, digits = 4) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Formats values already expressed as percentage points (e.g. 0.815 → "0,82%"). */
export function formatPercentAuto(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`
}

export function metricTone(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'text-neutral-500 dark:text-neutral-400'
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (value < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-neutral-500 dark:text-neutral-400'
}
