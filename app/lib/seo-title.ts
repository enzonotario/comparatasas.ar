/** Matches `titleTemplate: '%s | comparatasas.ar'` in nuxt.config.ts */
export const SEO_TITLE_TEMPLATE_SUFFIX = ' | comparatasas.ar'

/** Ahrefs Site Audit flags titles longer than 60 characters. */
export const SEO_TITLE_MAX_LENGTH = 60

function clipToBudget(text: string, budget: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= budget) return normalized

  const softBudget = Math.max(1, budget - 1)
  const slice = normalized.slice(0, softBudget)
  const cut = Math.max(slice.lastIndexOf(' - '), slice.lastIndexOf(' · '), slice.lastIndexOf(' '))
  const base = (cut >= Math.floor(softBudget * 0.5) ? slice.slice(0, cut) : slice).replace(
    /[·\-|–—,:.\s]+$/u,
    '',
  )

  return `${base || slice.trim()}…`
}

/**
 * Fit a page title so the rendered `<title>` stays within Ahrefs' limit
 * after Nuxt appends `| comparatasas.ar`.
 *
 * Pass `secondary` (e.g. `Histórico`) to keep that marker when the primary
 * name must be clipped.
 */
export function fitPageTitle(
  primary: string,
  secondary?: string,
  maxTotal: number = SEO_TITLE_MAX_LENGTH,
): string {
  const marker = secondary ? ` · ${secondary}` : ''
  const budget = maxTotal - SEO_TITLE_TEMPLATE_SUFFIX.length - marker.length
  return `${clipToBudget(primary, Math.max(1, budget))}${marker}`
}
