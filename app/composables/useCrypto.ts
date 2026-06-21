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

function processFilteredEntities(
  responseArray: CryptoEntity[],
  filterFn: (rendimiento: CryptoYield) => boolean,
): CryptoEntity[] {
  return normalizeEntities(
    responseArray
      .map((entity) => {
        const validRendimientos = entity.rendimientos.filter(filterFn)

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
}

async function fetchDataFromAPI(): Promise<CryptoEntity[]> {
  const response = await $fetch<CryptoEntity[]>(
    'https://api.argentinadatos.com/v1/finanzas/rendimientos',
  )
  return Array.isArray(response) ? response : JSON.parse(response)
}

export function useCrypto() {
  const {
    data,
    pending: loading,
    error,
    refresh: refreshCrypto,
  } = useAsyncData('crypto-rendimientos', fetchDataFromAPI, {
    default: () => [] as CryptoEntity[],
  })

  const dataProcessed = computed(() =>
    processFilteredEntities(
      data.value,
      (rendimiento) =>
        shouldShowCrypto(rendimiento.moneda) &&
        rendimiento.apy > 0 &&
        !isBlacklistedCrypto(rendimiento.moneda),
    ),
  )

  const dataAllProcessed = computed(() =>
    processFilteredEntities(
      data.value,
      (rendimiento) => rendimiento.apy > 0 && !isBlacklistedCrypto(rendimiento.moneda),
    ),
  )

  async function fetchCriptos() {
    if (!data.value.length) {
      await refreshCrypto()
    }
    return data.value
  }

  async function fetchAll() {
    if (!dataAllProcessed.value.length) {
      await refreshCrypto()
    }
    return dataAllProcessed.value
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
    dataAll: data,
    dataAllProcessed,
    loading,
    error,
    fetchCriptos,
    fetchAll,
    cryptosByMaxYield,
    getCryptoMaxYield: (crypto: string) => getCryptoMaxYield(crypto, data.value),
  }
}
