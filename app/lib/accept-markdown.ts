/**
 * Accept header negotiation helpers (acceptmarkdown.com / RFC 9110 style).
 */

export type AcceptEntry = { type: string; q: number; specificity: number }

export function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(',')
    .map((raw) => {
      const parts = raw
        .trim()
        .split(';')
        .map((s) => s.trim())
      const type = (parts[0] ?? '').toLowerCase()
      if (!type) return null
      let q = 1
      for (const param of parts.slice(1)) {
        const [name, value] = param.split('=').map((s) => s.trim())
        if (name === 'q') {
          const parsed = Number(value)
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed))
        }
      }
      const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2
      return { type, q, specificity }
    })
    .filter((e): e is AcceptEntry => e !== null)
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === '*/*') return true
  if (entry.type.endsWith('/*')) return candidate.startsWith(entry.type.slice(0, -1))
  return entry.type === candidate
}

export function preferredType(
  header: string | null | undefined,
  produces: string[],
): string | null {
  if (!header) return produces[0] ?? null
  const entries = parseAccept(header)
  if (entries.length === 0) return produces[0] ?? null

  let best: string | null = null
  let bestQ = -1
  let bestPos = Infinity

  for (const candidate of produces) {
    let matched: AcceptEntry | null = null
    let matchedPos = Infinity
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!
      if (!matches(e, candidate)) continue
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && i < matchedPos)
      ) {
        matched = e
        matchedPos = i
      }
    }
    if (!matched || matched.q <= 0) continue
    if (matched.q > bestQ || (matched.q === bestQ && matchedPos < bestPos)) {
      bestQ = matched.q
      bestPos = matchedPos
      best = candidate
    }
  }

  return best
}

export function prefersMarkdown(accept: string | null | undefined): boolean {
  return preferredType(accept, ['text/html', 'text/markdown']) === 'text/markdown'
}
