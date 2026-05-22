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
