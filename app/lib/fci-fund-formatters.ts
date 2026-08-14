export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(new Date(value))
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
