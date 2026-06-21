export type ComparaDolarAsset = 'usd' | 'usdc'

interface ComparaDolarUsdQuoteResponseItem {
  slug: string
  name?: string
  prettyName?: string
  bid: number
  ask: number
  url?: string
  logoUrl?: string
}

interface ComparaDolarStableQuoteResponseItem {
  id?: string
  slug: string
  prettyName?: string
  bid: number
  ask: number
  totalBid?: number
  totalAsk?: number
  url?: string
  logo?: string
}

export interface ComparaDolarQuote {
  asset: ComparaDolarAsset
  slug: string
  prettyName: string
  bid: number
  ask: number
  url?: string
  logoUrl?: string
}

async function fetchComparaDolarQuotes(): Promise<ComparaDolarQuote[]> {
  const [usdQuotes, usdcQuotes] = await Promise.all([
    $fetch<ComparaDolarUsdQuoteResponseItem[]>('https://api.comparadolar.ar/usd'),
    $fetch<ComparaDolarStableQuoteResponseItem[]>('https://api.comparadolar.ar/usdc'),
  ])

  return [
    ...(usdQuotes ?? []).map((item) => ({
      asset: 'usd' as const,
      slug: item.slug,
      prettyName: item.prettyName || item.name || item.slug,
      bid: item.bid,
      ask: item.ask,
      url: item.url,
      logoUrl: item.logoUrl,
    })),
    ...(usdcQuotes ?? []).map((item) => ({
      asset: 'usdc' as const,
      slug: item.slug,
      prettyName: item.prettyName || item.id || item.slug,
      bid: item.bid,
      ask: item.ask,
      url: item.url,
      logoUrl: item.logo,
    })),
  ]
}

export function useComparaDolarQuotes() {
  const {
    data: quotes,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('comparadolar-quotes', fetchComparaDolarQuotes, {
    default: () => [] as ComparaDolarQuote[],
  })

  return {
    quotes,
    loading,
    error,
    fetch,
  }
}
