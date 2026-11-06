import { mapCatalogToRows, type FundCatalogRow } from '../../app/lib/fci-catalog-rows'

export interface FciCatalogData {
  fechaActualizacion: string | null
  rows: FundCatalogRow[]
}

// Parses the ~31 MB upstream catalog once per cache window into the slim rows
// the /fondos UI needs. Shared by every /api/fci/* route derived from it.
// Nominal TNA comes from its own cached function; if it fails, rows fall back
// to computed returns (`null` TNA map). Both share the in-flight catalog parse.
export const getFciCatalog = defineCachedFunction(
  async (): Promise<FciCatalogData> => {
    const [catalog, staticTna] = await Promise.all([fetchFciUpstreamCatalog(), loadFciNominalTna()])

    return {
      fechaActualizacion: catalog.fechaActualizacion ?? null,
      rows: mapCatalogToRows(catalog, staticTna),
    }
  },
  {
    name: 'fci-catalog-data',
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)
