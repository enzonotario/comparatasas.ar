import { mapCatalogToRows } from '../../../app/lib/fci-catalog-rows'
import type { StaticNominalTnaFile } from '../../../app/lib/fci-static-nominal-tna'
import type { FciFundsDetailsResponse } from '../../../app/composables/useFciFundDetails'

const UPSTREAM_CATALOG_URL = 'https://api.argentinadatos.com/v1/finanzas/fci/fondos'

// `public/api/fci/nominal-tna.json` mounted as the `assets:fci` server asset
// (see nuxt.config). Missing/invalid file falls back to computed returns.
async function loadStaticNominalTna(): Promise<StaticNominalTnaFile | null> {
  try {
    return (await useStorage('assets:fci').getItem<StaticNominalTnaFile>('nominal-tna.json')) ?? null
  } catch {
    return null
  }
}

// Parses the ~31 MB upstream catalog once per cache window and returns only the
// slim rows the /fondos UI needs. Cache key ignores the query string on purpose.
export default defineCachedEventHandler(
  async () => {
    const [catalog, staticTna] = await Promise.all([
      $fetch<FciFundsDetailsResponse>(UPSTREAM_CATALOG_URL),
      loadStaticNominalTna(),
    ])

    return {
      fechaActualizacion: catalog.fechaActualizacion ?? null,
      rows: mapCatalogToRows(catalog, staticTna),
    }
  },
  {
    name: 'fci-catalog',
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)
