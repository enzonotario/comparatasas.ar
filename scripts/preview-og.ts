import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.OG_BASE_URL ?? 'http://localhost:3000'
const OUT_DIR = 'preview-og'

const routes = [
  { path: '/', name: 'home' },
  { path: '/plazos-fijos', name: 'plazos-fijos' },
  { path: '/fondos', name: 'fondos' },
  { path: '/usd', name: 'usd' },
  { path: '/criptomonedas', name: 'criptomonedas' },
  { path: '/creditos-hipotecarios-uva', name: 'creditos-hipotecarios-uva' },
]

function parseOgImageUrl(html: string): string | null {
  const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
  return match?.[1] ?? null
}

async function fetchOgImage(route: {
  path: string
  name: string
}): Promise<{ buffer: Buffer; ogUrl: string }> {
  const pageRes = await fetch(`${BASE_URL}${route.path}`)
  if (!pageRes.ok) throw new Error(`page HTTP ${pageRes.status}`)

  const html = await pageRes.text()
  const ogUrl = parseOgImageUrl(html)
  if (!ogUrl) throw new Error('og:image meta tag not found')

  const resolvedUrl = ogUrl.startsWith('http') ? ogUrl : new URL(ogUrl, BASE_URL).href
  const imgRes = await fetch(resolvedUrl)
  if (!imgRes.ok) throw new Error(`image HTTP ${imgRes.status} for ${resolvedUrl}`)

  const buffer = Buffer.from(await imgRes.arrayBuffer())
  return { buffer, ogUrl: resolvedUrl }
}

async function run(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true })

  const results = await Promise.allSettled(
    routes.map(async (route) => {
      const { buffer, ogUrl } = await fetchOgImage(route)
      const out = join(OUT_DIR, `${route.name}.png`)
      writeFileSync(out, buffer)
      return { out, ogUrl }
    }),
  )

  console.log('\n  OG Image URLs:\n')
  for (const [i, result] of results.entries()) {
    const name = routes[i]!.name
    if (result.status === 'fulfilled') {
      console.log(`  ${name}:`)
      console.log(`    ${result.value.ogUrl}\n`)
    } else {
      console.error(
        `  ✗ ${name}: ${result.reason instanceof Error ? result.reason.message : result.reason}\n`,
      )
    }
  }

  for (const [i, result] of results.entries()) {
    const name = routes[i]!.name
    if (result.status === 'fulfilled') {
      console.log(`✓  ${name}.png`)
    } else {
      console.error(
        `✗  ${name}: ${result.reason instanceof Error ? result.reason.message : result.reason}`,
      )
    }
  }
  const ok = results.filter((r) => r.status === 'fulfilled').length
  console.log(`\n${ok}/${routes.length} saved to ${OUT_DIR}/\n`)
}

async function main() {
  await run()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
