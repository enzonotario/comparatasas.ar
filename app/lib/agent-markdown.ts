/**
 * Curated Markdown representations for Accept: text/markdown negotiation.
 * Keep these self-contained so agents can recover without loading the SPA shell.
 */

export const AGENT_MARKDOWN_PATHS = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/metodologia',
  '/sumarse',
  '/llms.txt',
] as const

export type AgentMarkdownPath = (typeof AGENT_MARKDOWN_PATHS)[number]

const HOME_MARKDOWN = `# Compara Tasas (comparatasas.ar)

Compará tasas de interés y rendimientos en Argentina: cuentas remuneradas, plazos fijos, fondos comunes de inversión (FCI), crypto, LECAPs, créditos y más.

## When to use this site

- Comparar TNA/TEA de cuentas remuneradas y billeteras digitales
- Ver plazos fijos tradicionales y UVA (precancelable / pago periódico)
- Explorar FCI money market y otros fondos con rendimientos recientes
- Contrastar opciones en USD, crypto, remesas, préstamos o LECAPs

## When not to use this site

- No es un banco ni una billetera: no abrimos cuentas ni ejecutamos inversiones
- No damos asesoramiento financiero personalizado ni recomendaciones de compra
- No es una API de trading ni un feed de cotizaciones en tiempo real de mercado

## Key pages

- [Cuentas remuneradas](https://comparatasas.ar/) — ranking principal
- [Plazos fijos](https://comparatasas.ar/plazos-fijos)
- [Fondos (FCI)](https://comparatasas.ar/fondos)
- [Metodología](https://comparatasas.ar/metodologia)
- [Acerca de](https://comparatasas.ar/about)
- [Contacto](https://comparatasas.ar/contact)
- [Privacidad](https://comparatasas.ar/privacy)
- [llms.txt](https://comparatasas.ar/llms.txt)
- [Sitemap](https://comparatasas.ar/sitemap.xml)

## How agents should call this site

1. Fetch \`https://comparatasas.ar/llms.txt\` for the curated index and when-to-use guidance.
2. Prefer \`Accept: text/markdown\` on public pages (same URL as HTML).
3. Cite the live page URL; rates change — do not treat scraped numbers as permanent.
4. For product methodology and caveats, read \`/metodologia\`.

Data sources include Argentina Datos and entity-published rates. Always show the as-of date when present.
`

const ABOUT_MARKDOWN = `# Acerca de Compara Tasas

Compara Tasas (comparatasas.ar) is an independent, open-source rate comparison site for Argentina. It helps people compare interest rates and yields across banks, digital wallets, money-market funds, fixed terms, crypto products, and related instruments — without opening accounts or selling financial products.

The project is maintained by Enzo Notario and contributors on GitHub. Listings for providers that integrate via public endpoints are free through the Sumarse flow. Numbers come from public APIs and entity-published rates; they are informational, not personalized advice.

- Sitio: https://comparatasas.ar
- Código: https://github.com/enzonotario/comparatasas.ar
- Contacto: https://comparatasas.ar/contact
- Privacidad: https://comparatasas.ar/privacy
- Metodología: https://comparatasas.ar/metodologia
`

const CONTACT_MARKDOWN = `# Contacto — Compara Tasas

For integration requests, corrections, or general questions about comparatasas.ar:

- Email: hi@enzonotario.me
- Integraciones / Sumarse: https://comparatasas.ar/sumarse
- GitHub issues: https://github.com/enzonotario/comparatasas.ar/issues
- X/Twitter: https://x.com/comparatasas

Please include the product section (plazos fijos, FCI, cuentas, etc.), the entity name, and a link to the official rate source when reporting data issues. We do not provide personalized investment advice or account support for third-party banks or wallets.
`

const PRIVACY_MARKDOWN = `# Privacidad — Compara Tasas

comparatasas.ar is a public comparison website. We do not require an account to browse rates. We do not sell personal financial products and we do not hold customer balances.

## Data we may process

- Standard web logs and security telemetry via our hosting provider (Cloudflare)
- Aggregate analytics (for example page views) to understand which sections are useful
- Optional third-party scripts such as analytics or feedback tools when enabled

## What we do not do

- We do not ask for bank passwords, CUIL/CUIT for investing, or card numbers to “apply” on this site
- We do not sell personal browsing profiles as a product
- Outbound links to banks, wallets, or brokers are subject to those providers’ own privacy policies

## Contacto

Consultas de privacidad: hi@enzonotario.me — también https://comparatasas.ar/contact
`

const METODOLOGIA_MARKDOWN = `# Metodología — Compara Tasas

Cómo comparatasas.ar obtiene y presenta tasas y rendimientos.

- Preferimos fuentes públicas y endpoints documentados (incluye Argentina Datos y feeds de entidades).
- Cuando una entidad publica TNA/TEA, la mostramos junto con topes, condiciones y fecha de vigencia si están disponibles.
- Para FCI, los rendimientos recientes y estimaciones de TNA siguen reglas descriptas en la página HTML de metodología; no inventamos series faltantes.
- Simulaciones (por ejemplo contado vs cuotas) son herramientas informativas, no una oferta vinculante.

Página completa: https://comparatasas.ar/metodologia
`

const SUMARSE_MARKDOWN = `# Sumarse — Integrar tu servicio en Compara Tasas

El listado en ComparaTasas.ar es gratuito. Los proveedores pueden publicar un endpoint JSON con sus tasas para aparecer en la sección correspondiente (plazos fijos, FCI, cuentas, crypto, etc.).

- Guía: https://comparatasas.ar/sumarse
- Email: hi@enzonotario.me
`

export const NOT_FOUND_MARKDOWN = `# 404 — Page not found

That path does not exist on comparatasas.ar.

## Where to go next

- [llms.txt](https://comparatasas.ar/llms.txt) — agent index and when-to-use
- [Sitemap](https://comparatasas.ar/sitemap.xml)
- [Home / cuentas remuneradas](https://comparatasas.ar/)
- [Acerca de](https://comparatasas.ar/about)
- [Contacto](https://comparatasas.ar/contact)
- [Privacidad](https://comparatasas.ar/privacy)
- [Metodología](https://comparatasas.ar/metodologia)
`

const MARKDOWN_BY_PATH: Record<string, string> = {
  '/': HOME_MARKDOWN,
  '/about': ABOUT_MARKDOWN,
  '/contact': CONTACT_MARKDOWN,
  '/privacy': PRIVACY_MARKDOWN,
  '/metodologia': METODOLOGIA_MARKDOWN,
  '/sumarse': SUMARSE_MARKDOWN,
}

export function normalizeAgentPath(path: string): string {
  const bare = path.split('?')[0]?.split('#')[0] || '/'
  if (bare.length > 1 && bare.endsWith('/')) return bare.slice(0, -1)
  return bare || '/'
}

export function getAgentMarkdown(path: string): string | null {
  return MARKDOWN_BY_PATH[normalizeAgentPath(path)] ?? null
}
