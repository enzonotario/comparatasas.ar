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

const quotes = ref<ComparaDolarQuote[]>([])
const loading = ref(false)
const error = ref<unknown>(null)

export function useComparaDolarQuotes() {
  async function fetch(force = false): Promise<ComparaDolarQuote[]> {
    if (loading.value) return quotes.value
    if (!force && quotes.value.length > 0) return quotes.value

    loading.value = true
    error.value = null

    try {
      const [usdQuotes, usdcQuotes] = await Promise.all([
        $fetch<ComparaDolarUsdQuoteResponseItem[]>('https://api.comparadolar.ar/usd'),
        $fetch<ComparaDolarStableQuoteResponseItem[]>('https://api.comparadolar.ar/usdc'),
      ])

      quotes.value = [
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
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }

    return quotes.value
  }

  return {
    quotes,
    loading,
    error,
    fetch,
  }
}
