import { normalizeAgentPath } from '../../app/lib/agent-markdown'
import { mergeVary, negotiateAgentResponse } from '../../app/lib/agent-response'

function appendVaryAccept(event: Parameters<typeof setHeader>[0]) {
  const existing = getResponseHeader(event, 'Vary')
  setHeader(event, 'Vary', mergeVary(existing ? String(existing) : null, 'Accept'))
}

function isStaticAsset(path: string) {
  return (
    path.startsWith('/_nuxt/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/icons/') ||
    path.startsWith('/api/') ||
    path.startsWith('/_og') ||
    path === '/favicon.ico' ||
    path === '/sw.js' ||
    path === '/manifest.json' ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path === '/meta-imagen.png' ||
    /\.[a-z0-9]{2,8}$/i.test(path)
  )
}

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const path = normalizeAgentPath(event.path || '/')
  if (isStaticAsset(path)) return

  const accept = getHeader(event, 'accept') ?? null

  // Always advertise Accept variance on HTML document routes we negotiate.
  appendVaryAccept(event)

  const result = negotiateAgentResponse(path, accept)
  if (result.kind === 'passthrough') return

  setResponseStatus(event, result.status)
  setHeader(event, 'Content-Type', result.contentType)
  return result.body
})
