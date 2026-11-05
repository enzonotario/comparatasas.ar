import { selectSiblingCatalogRows } from '../../../../app/lib/fci-fund-groups'
import { normalizeFundSlug } from '../../../../app/lib/funds-detail'

const SLUG_PATTERN = /^[a-z0-9-]{1,200}$/

function readSlug(event: Parameters<typeof getRouterParam>[0]) {
  return String(getRouterParam(event, 'slug') || '')
}

// Catalog rows of the fund family (all share classes) for one fund slug, so
// fund detail pages can render sibling classes without the full catalog.
export default defineCachedEventHandler(
  async (event) => {
    const slug = readSlug(event)
    if (!SLUG_PATTERN.test(slug)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid fund slug' })
    }

    const { rows } = await getFciCatalog()
    const fund = rows.find((row) => normalizeFundSlug(row.fondo) === slug)
    if (!fund) return { rows: [] }

    return { rows: selectSiblingCatalogRows(rows, fund.fondo, { fondoId: fund.fondoId }) }
  },
  {
    name: 'fci-classes',
    maxAge: 60 * 60,
    swr: true,
    getKey: (event) => readSlug(event),
  },
)
