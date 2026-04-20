import { shouldShowCrypto, getCryptoMaxYield } from '~/lib/crypto-utils'

interface CryptoYield {
  moneda: string
  apy: number
}

interface CryptoEntity {
  entidad: string
  rendimientos: CryptoYield[]
}

const CRYPTO_BLACKLIST = ['WARS']

const data: Ref<CryptoEntity[]> = ref([])
const dataProcessed: Ref<CryptoEntity[]> = ref([])
const dataAll: Ref<CryptoEntity[]> = ref([])
const dataAllProcessed: Ref<CryptoEntity[]> = ref([])
const loading = ref(true)
const error = ref<unknown>(null)

function isBlacklistedCrypto(moneda: string): boolean {
  return CRYPTO_BLACKLIST.some((b) => b.toLowerCase() === (moneda || '').toLowerCase())
}

function getAllCryptos(cryptoYields: CryptoEntity[]): string[] {
  const cryptoSet = new Set<string>()
  cryptoYields.forEach((entity) => {
    entity.rendimientos.forEach((r) => {
      if (shouldShowCrypto(r.moneda) && r.apy > 0 && !isBlacklistedCrypto(r.moneda)) {
        cryptoSet.add(r.moneda)
      }
    })
  })
  return Array.from(cryptoSet)
}

function normalizeEntities(entities: CryptoEntity[]): CryptoEntity[] {
  const grouped = new Map<string, Map<string, number>>()

  entities.forEach((entity) => {
    const byCrypto = grouped.get(entity.entidad) ?? new Map<string, number>()

    entity.rendimientos.forEach((rendimiento) => {
      const current = byCrypto.get(rendimiento.moneda) ?? 0
      if (rendimiento.apy > current) {
        byCrypto.set(rendimiento.moneda, rendimiento.apy)
      }
    })

    grouped.set(entity.entidad, byCrypto)
  })

  return Array.from(grouped.entries())
    .map(([entidad, byCrypto]) => ({
      entidad,
      rendimientos: Array.from(byCrypto.entries())
        .map(([moneda, apy]) => ({ moneda, apy }))
        .sort((a, b) => a.moneda.localeCompare(b.moneda)),
    }))
    .sort((a, b) => a.entidad.localeCompare(b.entidad))
}

async function fetchDataFromAPI(): Promise<CryptoEntity[]> {
  const response = await $fetch<CryptoEntity[]>(
    'https://api.argentinadatos.com/v1/finanzas/rendimientos',
  )
  return Array.isArray(response) ? response : JSON.parse(response)
}

export function useCrypto() {
  async function fetchCriptos() {
    if (data.value.length > 0) {
      return data.value // Return cached data if available
    }

    loading.value = true
    error.value = null

    try {
      const responseArray = await fetchDataFromAPI()

      data.value = responseArray

      // Filtra criptomonedas válidas y consolida tokens duplicados por entidad (toma el máximo APY)
      dataProcessed.value = normalizeEntities(
        responseArray
        .map((entity) => {
          const validRendimientos = entity.rendimientos.filter(
            (rendimiento) =>
              shouldShowCrypto(rendimiento.moneda) &&
              rendimiento.apy > 0 &&
              !isBlacklistedCrypto(rendimiento.moneda),
          )

          // Consolida tokens duplicados tomando el máximo APY
          const consolidatedRendimientos = new Map<string, number>()
          validRendimientos.forEach((rendimiento) => {
            const currentMax = consolidatedRendimientos.get(rendimiento.moneda) || 0
            if (rendimiento.apy > currentMax) {
              consolidatedRendimientos.set(rendimiento.moneda, rendimiento.apy)
            }
          })

          const consolidated = Array.from(consolidatedRendimientos.entries()).map(
            ([moneda, apy]) => ({ moneda, apy }),
          )

          return {
            entidad: entity.entidad,
            rendimientos: consolidated,
          }
        })
        .filter((entity) => entity.rendimientos.length > 0),
      )
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }

    return data.value
  }

  async function fetchAll() {
    if (dataAllProcessed.value.length > 0) {
      return dataAllProcessed.value // Return cached processed data if available
    }

    loading.value = true
    error.value = null

    try {
      const responseArray = await fetchDataFromAPI()

      // Almacena todos los datos sin filtrar BLACKLISTED
      dataAll.value = responseArray

      // Procesa los datos sin filtrar por BLACKLISTED, solo filtra por APY > 0
      // y consolida tokens duplicados por entidad (toma el máximo APY)
      const processed = normalizeEntities(
        responseArray
        .map((entity) => {
          const validRendimientos = entity.rendimientos.filter(
            (rendimiento) => rendimiento.apy > 0 && !isBlacklistedCrypto(rendimiento.moneda),
          )

          // Consolida tokens duplicados tomando el máximo APY
          const consolidatedRendimientos = new Map<string, number>()
          validRendimientos.forEach((rendimiento) => {
            const currentMax = consolidatedRendimientos.get(rendimiento.moneda) || 0
            if (rendimiento.apy > currentMax) {
              consolidatedRendimientos.set(rendimiento.moneda, rendimiento.apy)
            }
          })

          const consolidated = Array.from(consolidatedRendimientos.entries()).map(
            ([moneda, apy]) => ({ moneda, apy }),
          )

          return {
            entidad: entity.entidad,
            rendimientos: consolidated,
          }
        })
        .filter((entity) => entity.rendimientos.length > 0),
      )

      // Almacena los datos procesados
      dataAllProcessed.value = processed

      return processed
    } catch (err) {
      error.value = err
      return []
    } finally {
      loading.value = false
    }
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
    dataAll,
    dataAllProcessed,
    loading,
    error,
    fetchCriptos,
    fetchAll,
    cryptosByMaxYield,
    getCryptoMaxYield: (crypto: string) => getCryptoMaxYield(crypto, data.value),
  }
}
