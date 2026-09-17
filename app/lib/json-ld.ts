/**
 * Helpers for schema.org JSON-LD in Nuxt head.
 * Prefer `innerHTML` over legacy `children` — modern Unhead treats unknown
 * keys as HTML attributes, which breaks JSON-LD parsers.
 */

export function jsonLdScript(data: object) {
  return {
    type: 'application/ld+json' as const,
    innerHTML: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

export const siteOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Compara Tasas',
  alternateName: ['comparatasas.ar', 'ComparaTasas.ar'],
  description:
    'Comparador de tasas de interés en Argentina: plazos fijos, fondos comunes de inversión, cuentas remuneradas, crypto y más.',
  url: 'https://comparatasas.ar',
  logo: 'https://comparatasas.ar/icons/icon-512x512.png',
  email: 'hi@enzonotario.me',
  sameAs: ['https://x.com/comparatasas', 'https://github.com/enzonotario/comparatasas.ar'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hi@enzonotario.me',
    contactType: 'customer support',
    availableLanguage: ['Spanish', 'es-AR'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AR',
    addressLocality: 'Argentina',
  },
} as const

export const sitePublisher = {
  '@type': 'Organization',
  name: 'Compara Tasas',
  url: 'https://comparatasas.ar',
  logo: 'https://comparatasas.ar/icons/icon-512x512.png',
} as const
