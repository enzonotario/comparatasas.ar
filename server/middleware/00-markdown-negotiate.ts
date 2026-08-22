import { getAgentMarkdown, NOT_FOUND_MARKDOWN, normalizeAgentPath } from '../../app/lib/agent-markdown'
import { preferredType, prefersMarkdown } from '../../app/lib/accept-markdown'

function appendVaryAccept(event: Parameters<typeof setHeader>[0]) {
  const existing = getResponseHeader(event, 'Vary') || getHeader(event, 'vary')
  if (!existing) {
    setHeader(event, 'Vary', 'Accept')
    return
  }
  const tokens = String(existing)
    .split(',')
    .map((s) => s.trim().toLowerCase())
  if (!tokens.includes('accept')) {
    setHeader(event, 'Vary', `${existing}, Accept`)
  }
}

function isStaticAsset(path: string) {
  return (
    path.startsWith('/_nuxt/')
    || path.startsWith('/assets/')
    || path.startsWith('/icons/')
    || path.startsWith('/api/')
    || path.startsWith('/_og')
    || path === '/favicon.ico'
    || path === '/sw.js'
    || path === '/manifest.json'
    || path === '/robots.txt'
    || path === '/sitemap.xml'
    || path === '/meta-imagen.png'
    || /\.[a-z0-9]{2,8}$/i.test(path)
  )
}

/** App sections that Nuxt owns — do not markdown-404 these. */
function isAppRoute(path: string) {
  if (path === '/') return true
  const prefixes = [
    '/about',
    '/contact',
    '/privacy',
    '/metodologia',
    '/sumarse',
    '/fondos',
    '/plazos-fijos',
    '/cuentas-billeteras',
    '/usd',
    '/criptomonedas',
    '/criptopesos',
    '/creditos-hipotecarios-uva',
    '/prestamos-personales',
    '/comisiones-cobro',
    '/contado-cuotas',
    '/remesas',
    '/lecaps',
    '/bonos-cer',
  ]
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const path = normalizeAgentPath(event.path || '/')
  if (isStaticAsset(path)) return

  const accept = getHeader(event, 'accept') ?? null
  const chosen = preferredType(accept, ['text/html', 'text/markdown'])

  // Always advertise Accept variance on HTML document routes we negotiate.
  appendVaryAccept(event)

  if (chosen === null && accept) {
    setResponseStatus(event, 406, 'Not Acceptable')
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'Not Acceptable\n\nAvailable: text/html, text/markdown\n'
  }

  if (!prefersMarkdown(accept)) return

  const markdown = getAgentMarkdown(path)
  if (markdown) {
    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    return markdown
  }

  // Known app URLs without a curated markdown body: fall through to Nuxt HTML.
  if (isAppRoute(path)) return

  // Unknown path + markdown Accept: agent-friendly 404 body.
  setResponseStatus(event, 404, 'Not Found')
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return NOT_FOUND_MARKDOWN
})
