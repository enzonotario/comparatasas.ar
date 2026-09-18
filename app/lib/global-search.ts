export interface GlobalSearchItem {
  id?: string
  label?: string
  suffix?: string
  keywords?: string[]
}

/** Normaliza texto de búsqueda: minúsculas y sin acentos. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function itemHaystack(item: GlobalSearchItem): string {
  return normalizeSearchText(
    [item.label, item.suffix, ...(item.keywords ?? [])].filter(Boolean).join(' '),
  )
}

function tokenMatchesHaystack(haystack: string, token: string): boolean {
  if (token.length === 1) {
    return haystack
      .split(/[^a-z0-9+]+/)
      .filter(Boolean)
      .some((word) => word.startsWith(token))
  }
  return haystack.includes(token)
}

/**
 * Filtra por tokens AND: cada palabra del término debe aparecer en label/suffix/keywords.
 * Tokens de 1 carácter solo matchean inicio de palabra (evita que "t" coincida con todo).
 */
export function filterBySearchTokens<T extends GlobalSearchItem>(term: string, items: T[]): T[] {
  const tokens = normalizeSearchText(term).split(/\s+/).filter(Boolean)
  if (!tokens.length) return items

  return items.filter((item) => {
    const haystack = itemHaystack(item)
    return tokens.every((token) => tokenMatchesHaystack(haystack, token))
  })
}

/** Ordena ítems de plazos fijos según prioridad canónica; el resto conserva su orden relativo. */
export function sortByPriorityMap<T extends { id?: string }>(
  items: T[],
  priorityById: Record<string, number>,
): T[] {
  return [...items].sort((a, b) => {
    const pa = a.id != null ? priorityById[a.id] : undefined
    const pb = b.id != null ? priorityById[b.id] : undefined
    if (pa != null && pb != null) return pa - pb
    return 0
  })
}
