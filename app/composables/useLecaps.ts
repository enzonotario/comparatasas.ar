import type { Lecap } from '../types/investments'
import { useHolidays } from './useHolidays'

const MONTH_CODES: Record<string, number> = {
  E: 0, // Enero
  F: 1, // Febrero
  M: 2, // Marzo
  A: 3, // Abril
  Y: 4, // Mayo
  J: 5, // Junio
  L: 6, // Julio
  G: 7, // Agosto
  S: 8, // Septiembre
  O: 9, // Octubre
  N: 10, // Noviembre
  D: 11, // Diciembre
}

function parseTickerMaturity(ticker: string): string | undefined {
  if (ticker.length < 5) return undefined
  const baseTicker = ticker.substring(0, 5)
  const type = baseTicker[0]
  if (type !== 'S' && type !== 'T') return undefined

  const dayStr = baseTicker.substring(1, 3)
  const monthCode = baseTicker[3]
  const yearDigit = baseTicker[4]

  const day = parseInt(dayStr)
  const month = MONTH_CODES[monthCode]
  const yearLastDigit = parseInt(yearDigit)

  if (isNaN(day) || month === undefined || isNaN(yearLastDigit)) return undefined

  const currentYear = new Date().getFullYear()
  const currentDecade = Math.floor(currentYear / 10) * 10
  let year = currentDecade + yearLastDigit

  if (year < currentYear - 1) {
    year += 10
  }

  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return undefined

  return date.toISOString().split('T')[0]
}

interface LicitacionData {
  ticker: string
  fechaEmision: string
  fechaVencimiento: string
  tem: number
  vpv: number
}

interface LecapsPayload {
  items: Lecap[]
  settlementDate: string
}

async function fetchLecapsPayload(getSettlementDate: (from: Date) => Promise<Date>) {
  const settlementDate = await getSettlementDate(new Date())
  const [notes, bonds, licitaciones] = await Promise.all([
    $fetch<any[]>('https://data912.com/live/arg_notes'),
    $fetch<any[]>('https://data912.com/live/arg_bonds'),
    $fetch<LicitacionData[]>('https://api.argentinadatos.com/v1/finanzas/letras'),
  ])

  const licitacionesMap = new Map<string, LicitacionData>()
  for (const lic of licitaciones) {
    licitacionesMap.set(lic.ticker, lic)
  }

  const result: Lecap[] = []

  const processItems = (items: any[]) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      const symbol = item.symbol as string
      if (!symbol.startsWith('S') && !symbol.startsWith('T')) continue
      if (symbol.startsWith('X') || symbol.startsWith('B') || symbol.startsWith('M')) continue

      const price = parseFloat(item.c) || 0
      if (price <= 0) continue

      const licData = licitacionesMap.get(symbol)
      const maturity = licData?.fechaVencimiento || parseTickerMaturity(symbol)
      const finalPayment = licData?.vpv || 0

      if (!finalPayment) continue

      result.push({
        symbol,
        price,
        bid: parseFloat(item.px_bid) || 0,
        ask: parseFloat(item.px_ask) || 0,
        type: symbol.startsWith('T') ? 'BONCAP' : 'LECAP',
        finalPayment,
        maturity,
      })
    }
  }

  processItems(notes)
  processItems(bonds)

  return {
    items: result,
    settlementDate: settlementDate.toISOString(),
  } satisfies LecapsPayload
}

export function useLecaps() {
  const { getSettlementDate } = useHolidays()

  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('lecaps', () => fetchLecapsPayload(getSettlementDate))

  const settlementDate = computed(() => {
    if (!data.value?.settlementDate) return null
    return new Date(data.value.settlementDate)
  })

  const lecaps = computed(() => data.value?.items ?? [])

  const lecapsItems = computed(() => {
    const sDate = settlementDate.value ?? new Date()
    return lecaps.value.map((lecap) => {
      let days = 0
      let tir = 0
      let tna = 0

      if (lecap.maturity) {
        const maturityDate = new Date(lecap.maturity)
        const diffTime = maturityDate.getTime() - sDate.getTime()
        days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

        if (days > 0 && lecap.finalPayment && lecap.price > 0) {
          const ganancia = lecap.finalPayment / lecap.price
          tna = (ganancia - 1) * (365 / days)
          tir = Math.pow(ganancia, 365 / days) - 1
        }
      }

      return {
        institution: lecap.symbol,
        symbol: lecap.symbol,
        price: lecap.price,
        finalPayment: lecap.finalPayment,
        days,
        maturity: lecap.maturity,
        tna,
        tir,
        bid: lecap.bid,
        ask: lecap.ask,
        type: lecap.type,
        typeLabel: lecap.type === 'LECAP' ? 'LECAP' : 'BONCAP',
        url: `https://www.google.com/search?q=${lecap.symbol}+cotizacion+argentina`,
      }
    })
  })

  return {
    lecaps,
    lecapsItems,
    loading,
    error,
    fetch,
  }
}
