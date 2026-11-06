import { buildFciNominalTnaFile, type FetchJson } from '../../app/lib/finance/build-fci-nominal-tna'
import type { StaticNominalTnaFile } from '../../app/lib/fci-static-nominal-tna'

export const FCI_NOMINAL_TNA_MAX_AGE = 6 * 60 * 60

const HISTORY_TIMEOUT_MS = 20_000

const fetchJson: FetchJson = async <T>(url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS) })
  if (!response.ok) return null
  return (await response.json()) as T
}

// Nitro drops its in-flight promise before the (non-awaited) storage write
// lands, so a request in that gap would rebuild everything. Reuse a successful
// build briefly (payload is ~45 KB) to bridge it.
const RECENT_BUILD_REUSE_MS = 60_000
let sharedBuild: Promise<StaticNominalTnaFile> | null = null

function buildNominalTnaShared(): Promise<StaticNominalTnaFile> {
  if (sharedBuild) return sharedBuild
  const build = buildFciNominalTnaFile({ fetchJson, loadCatalog: fetchFciUpstreamCatalog })
  sharedBuild = build
  const release = () => {
    if (sharedBuild === build) sharedBuild = null
  }
  build.then(() => setTimeout(release, RECENT_BUILD_REUSE_MS).unref?.(), release)
  return build
}

// Nominal TNA estimates (~230 history fetches). Computed at most once per cache
// window and shared by `/api/fci/nominal-tna.json` and the catalog rows.
// Throws on failure: nothing is cached and SWR keeps serving the previous value.
export const getFciNominalTna = defineCachedFunction(
  (): Promise<StaticNominalTnaFile> => buildNominalTnaShared(),
  {
    name: 'fci-nominal-tna-data',
    maxAge: FCI_NOMINAL_TNA_MAX_AGE,
    swr: true,
    getKey: () => 'v1',
  },
)

/** Same as `getFciNominalTna`, but `null` on failure so callers can degrade. */
export async function loadFciNominalTna(): Promise<StaticNominalTnaFile | null> {
  try {
    return await getFciNominalTna()
  } catch (error) {
    console.error('[fci-tna] Nominal TNA computation failed:', error)
    return null
  }
}
