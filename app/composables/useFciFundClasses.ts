import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { FundCatalogRow } from '~/lib/fci-catalog-rows'

// Catalog rows of one fund's family (sibling classes), derived server-side so
// detail pages never need the full ~2.8 MB catalog. Shared by the detail view
// and the /fondos sidebar: same key and options, so a single fetch is deduped.
export function useFciFundClasses(slugSource: MaybeRefOrGetter<string>) {
  const slug = computed(() => String(toValue(slugSource) || ''))

  const { data, status, error } = useAsyncData(
    () => `fci-fund-classes:${slug.value}`,
    async () => {
      if (!slug.value) return [] as FundCatalogRow[]
      const payload = await $fetch<{ rows: FundCatalogRow[] }>(
        `/api/fci/classes/${encodeURIComponent(slug.value)}`,
      )
      return payload.rows
    },
    {
      default: () => [] as FundCatalogRow[],
      // The layout sidebar (key watcher) and the page both trigger on client
      // navigation; join the in-flight request instead of cancelling it.
      dedupe: 'defer',
    },
  )

  return { classRows: data, status, error }
}
