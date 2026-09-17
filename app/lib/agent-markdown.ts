/**
 * Curated Markdown representations for Accept: text/markdown negotiation.
 * Keep these self-contained so agents can recover without loading the SPA shell.
 */
import { AGENT_NEGOTIATED_ROUTES } from './agent-routes'

export const AGENT_MARKDOWN_PATHS = [...AGENT_NEGOTIATED_ROUTES, '/llms.txt'] as const

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

## Fuentes y actualización

- Preferimos fuentes públicas y endpoints documentados, incluidos Argentina Datos, CNV y feeds publicados por las entidades.
- Mostramos fecha de vigencia o actualización cuando la fuente la informa.
- No completamos tasas o series faltantes con estimaciones inventadas.

## Comparabilidad

- TNA, TEA, APY, topes y condiciones no son intercambiables: cada tabla conserva la unidad y los límites relevantes.
- Para FCI, los rendimientos recientes y la TNA estimada dependen de la variación de cuotaparte y del período disponible.
- Las simulaciones usan los supuestos visibles en cada herramienta y son informativas; no constituyen una oferta ni asesoramiento personalizado.

Antes de contratar, verificá tasa, vigencia, impuestos y requisitos en el sitio oficial de la entidad.

Página completa: https://comparatasas.ar/metodologia
`

const SUMARSE_MARKDOWN = `# Sumarse — Integrar tu servicio en Compara Tasas

El listado en ComparaTasas.ar es gratuito. Los proveedores pueden publicar un endpoint JSON con sus tasas para aparecer en la sección correspondiente (plazos fijos, FCI, cuentas, crypto, etc.).

## Qué enviar

- Una URL pública y estable que responda JSON sin autenticación interactiva.
- Tasas en la unidad indicada por la guía de cada producto.
- Nombre de la entidad, enlace oficial, condiciones, topes y fecha de vigencia cuando correspondan.
- Un contacto técnico para avisar cambios incompatibles o problemas de actualización.

La integración no garantiza una posición en el ranking: el orden depende de los valores y filtros comparables. Compara Tasas puede omitir datos vencidos, ambiguos o que no puedan verificarse. No hace falta pagar para ser incluido.

## Próximos pasos

1. Elegí el tipo de producto en la guía.
2. Validá el ejemplo y publicá el endpoint.
3. Enviá la URL y el contexto a hi@enzonotario.me.

- Guía completa: https://comparatasas.ar/sumarse
- Metodología: https://comparatasas.ar/metodologia
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
