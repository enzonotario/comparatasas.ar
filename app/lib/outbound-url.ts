/** Params de atribución para links salientes (mismo criterio que Docta / banners). */
export const OUTBOUND_UTM_SOURCE = 'comparatasas'
export const OUTBOUND_REF = 'comparatasas'

export interface OutboundUtmOptions {
  /** Campaña opcional (`utm_campaign`). */
  campaign?: string
  /**
   * Si es `true` (default), asegura `ref=comparatasas` cuando no hay `ref`.
   * Si es string, usa ese valor. Si es `false`, no toca `ref`.
   */
  ref?: boolean | string
}

function isHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * Agrega `utm_source=comparatasas`, `utm_medium` y opcionalmente `utm_campaign` / `ref`
 * sin pisar el hash ni el resto de query params.
 */
export function withOutboundUtm(
  url: string,
  medium: string,
  options: OutboundUtmOptions = {},
): string {
  if (!url || url === '#') return url
  if (url.startsWith('/') && !url.startsWith('//')) return url

  try {
    const parsed = new URL(url)
    if (!isHttpUrl(parsed)) return url

    const mediumValue = medium.trim()
    if (!mediumValue) return url

    parsed.searchParams.set('utm_source', OUTBOUND_UTM_SOURCE)
    parsed.searchParams.set('utm_medium', mediumValue)

    if (options.campaign) {
      parsed.searchParams.set('utm_campaign', options.campaign)
    }

    const refOption = options.ref ?? true
    if (refOption !== false && !parsed.searchParams.has('ref')) {
      parsed.searchParams.set('ref', typeof refOption === 'string' ? refOption : OUTBOUND_REF)
    }

    return parsed.toString()
  } catch {
    return url
  }
}
