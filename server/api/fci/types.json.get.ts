import { listFundTipoOptions } from '../../../app/lib/fci-catalog-rows'

// Fund types present in the catalog, for the /fondos sidebar. Keeps the layout
// from embedding the full catalog in every /fondos/* SSR payload.
export default defineCachedEventHandler(
  async () => ({ types: listFundTipoOptions((await getFciCatalog()).rows) }),
  {
    name: 'fci-types',
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)
