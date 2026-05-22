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

export function normalizeCurrencyCode(currency: string | null | undefined) {
  const normalized = (currency || '').trim().toLowerCase()

  if (!normalized) return 'ARS'
  if (['ars', 'peso argentina', 'pesos argentinos'].includes(normalized)) return 'ARS'
  if (
    [
      'usd',
      'u$s',
      'dolar estadounidense',
      'dolar estadounidense billete',
      'dolar estadounidense cable',
      'dólar estadounidense',
      'dólar estadounidense billete',
      'dólar estadounidense cable',
    ].includes(normalized)
  ) {
    return 'USD'
  }

  return currency?.toUpperCase() || 'ARS'
}

export function formatCurrency(value: number | null | undefined, currency = 'ARS') {
  if (value == null || !Number.isFinite(value)) return '—'
  const safeCurrency = normalizeCurrencyCode(currency)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(value)
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

export function formatPercentAuto(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '—'
  const normalized = Math.abs(value) <= 1 ? value * 100 : value
  return `${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(normalized)}%`
}

export function metricTone(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'text-neutral-500 dark:text-neutral-400'
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (value < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-neutral-500 dark:text-neutral-400'
}
