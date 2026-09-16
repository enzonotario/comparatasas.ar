import { AGENT_NEGOTIATED_ROUTES } from '../app/lib/agent-routes'

const AGENT_USER_AGENTS = [
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'DeepSeekBot',
  'ora-agent',
] as const

function getBaseUrl(): string {
  const args = process.argv.slice(2)
  const flagIndex = args.indexOf('--base-url')
  const value =
    (flagIndex >= 0 ? args[flagIndex + 1] : args.find((arg) => !arg.startsWith('--'))) ||
    process.env.AGENT_READINESS_BASE_URL ||
    'http://127.0.0.1:3000'

  return value.replace(/\/+$/, '')
}

function includesVaryAccept(response: Response): boolean {
  return (response.headers.get('vary') ?? '')
    .split(',')
    .some((value) => value.trim().toLowerCase() === 'accept')
}

async function request(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
    ...init,
  })
  return { response, body: await response.text() }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function verifyNegotiatedRoutes(baseUrl: string) {
  for (const path of AGENT_NEGOTIATED_ROUTES) {
    const html = await request(baseUrl, path, { headers: { Accept: 'text/html' } })
    assert(html.response.status === 200, `${path} HTML respondió ${html.response.status}`)
    assert(
      (html.response.headers.get('content-type') ?? '').startsWith('text/html'),
      `${path} HTML devolvió Content-Type incorrecto`,
    )
    assert(includesVaryAccept(html.response), `${path} HTML no incluye Vary: Accept`)

    const markdown = await request(baseUrl, path, { headers: { Accept: 'text/markdown' } })
    assert(
      markdown.response.status === 200,
      `${path} Markdown respondió ${markdown.response.status}`,
    )
    assert(
      (markdown.response.headers.get('content-type') ?? '').startsWith('text/markdown'),
      `${path} Markdown devolvió Content-Type incorrecto`,
    )
    assert(includesVaryAccept(markdown.response), `${path} Markdown no incluye Vary: Accept`)
    assert(markdown.body.length > 500, `${path} Markdown tiene menos de 500 caracteres`)
  }
}

async function verifyErrorRecovery(baseUrl: string) {
  const notFound = await request(baseUrl, '/about/inexistente', {
    headers: { Accept: 'text/markdown' },
  })
  assert(notFound.response.status === 404, `404 Markdown respondió ${notFound.response.status}`)
  assert(
    (notFound.response.headers.get('content-type') ?? '').startsWith('text/markdown'),
    '404 Markdown devolvió Content-Type incorrecto',
  )
  assert(notFound.body.includes('/llms.txt'), '404 Markdown no enlaza llms.txt')
  assert(notFound.body.includes('/sitemap.xml'), '404 Markdown no enlaza sitemap.xml')

  const unacceptable = await request(baseUrl, '/about', {
    headers: { Accept: 'application/pdf' },
  })
  assert(
    unacceptable.response.status === 406,
    `Accept incompatible respondió ${unacceptable.response.status}`,
  )
  assert(includesVaryAccept(unacceptable.response), '406 no incluye Vary: Accept')
}

async function verifyDiscoveryFiles(baseUrl: string) {
  const sitemap = await request(baseUrl, '/sitemap.xml')
  assert(sitemap.response.status === 200, `sitemap.xml respondió ${sitemap.response.status}`)
  for (const path of AGENT_NEGOTIATED_ROUTES) {
    const absolute = new URL(path, 'https://comparatasas.ar').toString()
    assert(sitemap.body.includes(absolute), `sitemap.xml no incluye ${absolute}`)
  }

  const llms = await request(baseUrl, '/llms.txt')
  assert(llms.response.status === 200, `llms.txt respondió ${llms.response.status}`)
  assert(llms.body.includes('When to use Compara Tasas'), 'llms.txt no contiene orientación de uso')
  assert(llms.body.includes('/metodologia'), 'llms.txt no enlaza metodología')
}

async function verifyAgentReachability(baseUrl: string) {
  for (const userAgent of AGENT_USER_AGENTS) {
    const result = await request(baseUrl, '/', {
      headers: { Accept: 'text/markdown', 'User-Agent': userAgent },
    })
    assert(result.response.status === 200, `${userAgent} recibió ${result.response.status}`)
    assert(
      (result.response.headers.get('content-type') ?? '').startsWith('text/markdown'),
      `${userAgent} no recibió Markdown`,
    )
  }
}

const baseUrl = getBaseUrl()

await verifyNegotiatedRoutes(baseUrl)
await verifyErrorRecovery(baseUrl)
await verifyDiscoveryFiles(baseUrl)
await verifyAgentReachability(baseUrl)

console.log(`Agent readiness verificado en ${baseUrl}`)
