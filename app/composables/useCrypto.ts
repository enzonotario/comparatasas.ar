import { shouldShowCrypto, getCryptoMaxYield } from '~/lib/crypto-utils'

interface CryptoYield {
  moneda: string
  apy: number
}

interface CryptoEntity {
  entidad: string
  rendimientos: CryptoYield[]
}

const data: Ref<CryptoEntity[]> = ref([])
const dataProcessed: Ref<CryptoEntity[]> = ref([])
const loading = ref(true)
const error = ref<unknown>(null)

function getAllCryptos(cryptoYields: CryptoEntity[]): string[] {
  const cryptoSet = new Set<string>()
  cryptoYields.forEach((entity) => {
    entity.rendimientos.forEach((r) => {
      if (shouldShowCrypto(r.moneda) && r.apy > 0) {
        cryptoSet.add(r.moneda)
      }
    })
  })
  return Array.from(cryptoSet)
}

export function useCrypto() {
  async function fetch() {
    if (data.value.length > 0) {
      return data.value // Return cached data if available
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<CryptoEntity[]>(
        'https://api.comparatasas.ar/v1/finanzas/rendimientos',
      )

      const responseArray = Array.isArray(response) ? response : JSON.parse(response)

      data.value = responseArray

      // Filter cryptocurrencies that shouldn't be shown and those with APY of 0
      dataProcessed.value = responseArray
        .map((entity) => ({
          entidad: entity.entidad,
          rendimientos: entity.rendimientos.filter(
            (rendimiento) => shouldShowCrypto(rendimiento.moneda) && rendimiento.apy > 0,
          ),
        }))
        // Filter entities that have no yields after filtering
        .filter((entity) => entity.rendimientos.length > 0)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }

    return data.value
  }

  const cryptosByMaxYield = computed(() => {
    return getAllCryptos(data.value)
      .map((crypto) => {
        const maxYield = getCryptoMaxYield(crypto, data.value)
        return { crypto, maxYield }
      })
      .sort((a, b) => b.maxYield - a.maxYield)
  })

  return {
    data,
    dataProcessed,
    loading,
    error,
    fetch,
    cryptosByMaxYield,
    getCryptoMaxYield: (crypto: string) => getCryptoMaxYield(crypto, data.value),
  }
}
