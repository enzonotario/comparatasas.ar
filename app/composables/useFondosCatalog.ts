import type { FundCatalogRow } from '~/lib/fci-catalog-rows'

export { mapCatalogToRows, type FundCatalogRow } from '~/lib/fci-catalog-rows'

export interface FciCatalogPayload {
  fechaActualizacion: string | null
  rows: FundCatalogRow[]
}

export function useFondosCatalog() {
  const {
    data: allFunds,
    pending: loading,
    error,
    refresh,
  } = useAsyncData(
    'fci-funds-catalog',
    async () => {
      // Server-side cached route: the ~31 MB upstream catalog is parsed once per
      // cache window instead of on every SSR render.
      const payload = await $fetch<FciCatalogPayload>('/api/fci/catalog.json')
      return payload.rows
    },
    {
      default: () => [] as FundCatalogRow[],
    },
  )

  return {
    allFunds,
    loading,
    error,
    refresh,
  }
}
