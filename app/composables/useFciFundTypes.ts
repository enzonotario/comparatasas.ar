import type { FundTipoOption } from '~/lib/fci-catalog-rows'

// Fund types present in the catalog (tiny payload) for the /fondos sidebar.
export function useFciFundTypes() {
  const { data, status, error } = useAsyncData(
    'fci-fund-types',
    async () => {
      const payload = await $fetch<{ types: FundTipoOption[] }>('/api/fci/types.json')
      return payload.types
    },
    {
      default: () => [] as FundTipoOption[],
    },
  )

  return { fundTypes: data, status, error }
}
