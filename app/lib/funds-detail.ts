export function normalizeFundSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getFundDetailPath(nameOrSlug: string): string {
  const slug = normalizeFundSlug(nameOrSlug)
  return `/fondos/${slug}`
}

export type FundDetailTab = 'resumen' | 'historico'

/** Path or route location that preserves the detail tab across class changes. */
export function getFundDetailTo(
  nameOrSlug: string,
  options?: { tab?: string | null },
): string | { path: string; query: { tab: string } } {
  const path = getFundDetailPath(nameOrSlug)
  const tab = options?.tab
  if (tab === 'historico') {
    return { path, query: { tab: 'historico' } }
  }
  return path
}
