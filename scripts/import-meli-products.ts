import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type PlanInputMode = 'installment' | 'total'

interface ProductScenario {
  id: string
  name: string
  merchant?: string
  imageUrl?: string
  affiliateUrl: string
  priceLabel?: string
  installmentLabel?: string
  cashPrice: number
  installmentCount: number
  inputMode: PlanInputMode
  installmentAmount?: number
  financedTotal?: number
}

interface ProductImportItem {
  url: string
  mismoPrecioCuotas?: number | boolean | null
  cuotas?: number | null
}

const DEFAULT_OUTPUT_PATH = 'app/data/contado-cuotas-products.json'
const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'es-AR,es;q=0.9,en;q=0.8',
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function parseArsNumber(value: string | undefined, fallback = 0): number {
  if (!value) return fallback
  const normalized = value.replace(/[^\d]/g, '')
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function humanizeSlug(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCurrency(value: number): string {
  return `$${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function safeMatch(input: string, pattern: RegExp): string | undefined {
  return input.match(pattern)?.[1]
}

function findInstallmentChunk(html: string): string | undefined {
  const marker = 'class="poly-price__installments">'
  const start = html.indexOf(marker)
  if (start < 0) return undefined

  const from = start + marker.length
  const endMarkers = [
    '</div><div class="poly-component__shipping"',
    '</div></div><div class="poly-content__column"',
    '</span></div><div class="poly-component__shipping"',
  ]

  const candidates = endMarkers
    .map((marker) => html.indexOf(marker, from))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)

  const end = candidates[0]
  return end == null ? undefined : html.slice(from, end)
}

function cleanInstallmentLabel(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  const normalized = compact.replace(/\s+tarjeta Mercado Pago$/i, '')
  return normalized
}

function parseInstallmentData(label: string, cashPrice: number) {
  const match = label.match(/(?:Mismo precio\s+)?(\d+)\s+cuotas?\s+de\s+\$?\s*([\d.]+)/i)
  if (!match) {
    return {
      installmentCount: 1,
      installmentAmount: cashPrice,
      financedTotal: cashPrice,
    }
  }

  const installmentCount = Number.parseInt(match[1]!, 10)
  const installmentAmount = parseArsNumber(match[2], cashPrice)
  const financedTotal = installmentCount * installmentAmount

  return {
    installmentCount,
    installmentAmount,
    financedTotal,
  }
}

function formatInstallmentLabel(
  rawLabel: string,
  installmentCount: number,
  installmentAmount: number,
): string {
  const base = `${installmentCount} cuotas de ${formatCurrency(installmentAmount)}`
  return /^Mismo precio/i.test(rawLabel) ? `Mismo precio · ${base}` : base
}

function normalizeAffiliateUrl(value: string): string {
  return value.trim()
}

function applyManualSamePriceOverride(
  scenario: ProductScenario,
  mismoPrecioCuotas?: number | boolean | null,
  cuotas?: number | null,
): ProductScenario {
  if (!mismoPrecioCuotas) {
    return scenario
  }

  const installmentCount =
    typeof cuotas === 'number' && Number.isFinite(cuotas) && cuotas >= 1
      ? Math.max(1, Math.round(cuotas))
      : mismoPrecioCuotas === true
        ? Math.max(1, scenario.installmentCount)
        : Number.isFinite(mismoPrecioCuotas) && mismoPrecioCuotas >= 1
          ? Math.max(1, Math.round(mismoPrecioCuotas))
          : 0

  if (installmentCount < 1) {
    return scenario
  }

  const installmentAmount = Math.floor(scenario.cashPrice / installmentCount)

  return {
    ...scenario,
    installmentCount,
    installmentAmount,
    financedTotal: scenario.cashPrice,
    installmentLabel: `Mismo precio · ${installmentCount} cuotas de ${formatCurrency(installmentAmount)}`,
  }
}

function deriveNameFromProductUrl(productUrl: string): string | undefined {
  const normalized = decodeHtml(productUrl)
  const match = normalized.match(/mercadolibre\.com\.ar\/([^/?#]+(?:\/[^/?#]+)*)\/p\/[A-Z0-9]+/i)
  const slug = match?.[1]?.split('/').at(-1)
  return slug ? humanizeSlug(slug) : undefined
}

function buildScenarioFromHtml(html: string, affiliateUrl: string): ProductScenario {
  const productUrl = decodeHtml(
    safeMatch(html, /<a[^>]+href="([^"]+)"[^>]+class="poly-component__title"/i) ??
      safeMatch(
        html,
        /<a[^>]+href="([^"]+)"[^>]+class="poly-component__link poly-component__link--action-link"/i,
      ) ??
      '',
  )
  const name =
    stripTags(
      safeMatch(html, /<a[^>]+class="poly-component__title"[^>]*>([\s\S]*?)<\/a>/i) ?? '',
    ) || deriveNameFromProductUrl(productUrl)
  if (!name) {
    throw new Error('No pude extraer el nombre del producto')
  }

  const sellerRaw = safeMatch(
    html,
    /<span[^>]+class="poly-component__seller"[^>]*>([\s\S]*?)<\/span>/i,
  )
  const seller = sellerRaw
    ? stripTags(sellerRaw)
        .replace(/^Por\s+/i, '')
        .trim()
    : undefined

  const imageUrl = decodeHtml(
    safeMatch(html, /<img[^>]+class="poly-component__picture"[^>]+src="([^"]+)"/i) ?? '',
  )

  const cashPrice = parseArsNumber(
    safeMatch(
      html,
      /<div class="poly-price__current"><span[^>]+aria-label="Ahora:\s*([\d.]+)\s+pesos argentinos"/i,
    ) ?? safeMatch(html, /aria-label="Ahora:\s*([\d.]+)\s+pesos argentinos"/i),
  )
  if (!cashPrice) {
    throw new Error(`No pude extraer el precio actual para "${name}"`)
  }

  const installmentChunk = findInstallmentChunk(html)
  const rawInstallmentLabel = installmentChunk ? stripTags(installmentChunk) : ''
  const normalizedRawInstallmentLabel = rawInstallmentLabel
    ? cleanInstallmentLabel(rawInstallmentLabel)
    : '1 cuota'

  const { installmentCount, installmentAmount, financedTotal } = parseInstallmentData(
    normalizedRawInstallmentLabel,
    cashPrice,
  )
  const installmentLabel = formatInstallmentLabel(
    normalizedRawInstallmentLabel,
    installmentCount,
    installmentAmount,
  )

  const productId = safeMatch(productUrl, /\/p\/([A-Z0-9]+)/i)
  const slugParts = [slugify(name), productId?.toLowerCase()].filter(Boolean)

  return {
    id: slugParts.join('-'),
    name,
    merchant: seller || 'Mercado Libre',
    imageUrl: imageUrl || undefined,
    affiliateUrl: normalizeAffiliateUrl(affiliateUrl),
    priceLabel: `Ahora: ${formatCurrency(cashPrice)}`,
    installmentLabel,
    cashPrice,
    installmentCount,
    inputMode: 'installment',
    installmentAmount,
    financedTotal,
  }
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return await response.text()
}

function parseArgs(argv: string[]) {
  let outputPath = DEFAULT_OUTPUT_PATH
  let filePath: string | undefined
  let htmlFilePath: string | undefined
  let htmlAffiliateUrl: string | undefined
  const urls: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg) continue

    if (arg === '--output' || arg === '-o') {
      outputPath = argv[++i] ?? outputPath
      continue
    }

    if (arg === '--file' || arg === '-f') {
      filePath = argv[++i]
      continue
    }

    if (arg === '--html-file' || arg === '-H') {
      htmlFilePath = argv[++i]
      continue
    }

    if (arg === '--affiliate-url' || arg === '-u') {
      htmlAffiliateUrl = argv[++i]
      continue
    }

    urls.push(arg)
  }

  return { outputPath, filePath, htmlFilePath, htmlAffiliateUrl, urls }
}

function readItemsFromFile(filePath: string): ProductImportItem[] {
  const raw = readFileSync(resolve(filePath), 'utf8').trim()

  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('El JSON debe ser un array')

    return parsed
      .map((item) => {
        if (typeof item === 'string') return { url: item, mismoPrecioCuotas: null, cuotas: null }
        if (item && typeof item === 'object' && typeof item.url === 'string') {
          return {
            url: item.url,
            mismoPrecioCuotas:
              typeof item.mismoPrecioCuotas === 'number' ||
              typeof item.mismoPrecioCuotas === 'boolean'
                ? item.mismoPrecioCuotas
                : null,
            cuotas: typeof item.cuotas === 'number' ? item.cuotas : null,
          }
        }
        return null
      })
      .filter((item): item is ProductImportItem => Boolean(item?.url))
  } catch {
    return raw
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url, mismoPrecioCuotas: null, cuotas: null }))
  }
}

function readExistingProducts(path: string): ProductScenario[] {
  try {
    const raw = readFileSync(resolve(path), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeProducts(
  existing: ProductScenario[],
  incoming: ProductScenario[],
): ProductScenario[] {
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }

  const incomingIds = new Set(incoming.map((item) => item.id))
  const preserved = existing.filter((item) => !incomingIds.has(item.id))
  return [...preserved, ...incoming]
}

async function main() {
  const { outputPath, filePath, htmlFilePath, htmlAffiliateUrl, urls } = parseArgs(
    process.argv.slice(2),
  )
  const inputItems: ProductImportItem[] = [
    ...urls.map((url) => ({ url, mismoPrecioCuotas: null, cuotas: null })),
    ...(filePath ? readItemsFromFile(filePath) : []),
  ]
  const uniqueItems = [
    ...new Map(
      inputItems
        .map((item) => [item.url.trim(), { ...item, url: item.url.trim() }])
        .filter(([url]) => Boolean(url)),
    ).values(),
  ]

  if (uniqueItems.length === 0 && !htmlFilePath) {
    console.error(
      'Uso: pnpm import-meli-products <url...> [--file links.txt] [--html-file snippet.html --affiliate-url https://meli.la/...] [--output app/data/contado-cuotas-products.json]',
    )
    process.exit(1)
  }

  const imported: ProductScenario[] = []

  if (htmlFilePath) {
    const html = readFileSync(resolve(htmlFilePath), 'utf8')
    const affiliateUrl = htmlAffiliateUrl ?? 'https://meli.la/'
    console.log(`→ Importando snippet HTML ${htmlFilePath}`)
    const scenario = buildScenarioFromHtml(html, affiliateUrl)
    imported.push(scenario)
    console.log(
      `  ✓ ${scenario.name} · ${scenario.installmentCount} cuotas de ${formatCurrency(scenario.installmentAmount ?? scenario.cashPrice)}`,
    )
  }

  for (const item of uniqueItems) {
    console.log(`→ Importando ${item.url}`)
    const html = await fetchHtml(item.url)
    const scenario = applyManualSamePriceOverride(
      buildScenarioFromHtml(html, item.url),
      item.mismoPrecioCuotas,
      item.cuotas,
    )
    imported.push(scenario)
    console.log(
      `  ✓ ${scenario.name} · ${scenario.installmentCount} cuotas de ${formatCurrency(scenario.installmentAmount ?? scenario.cashPrice)}`,
    )
  }

  const existing = readExistingProducts(outputPath)
  const merged = mergeProducts(existing, imported)

  mkdirSync(dirname(resolve(outputPath)), { recursive: true })
  writeFileSync(resolve(outputPath), `${JSON.stringify(merged, null, 2)}\n`, 'utf8')

  console.log(`\nGuardado en ${resolve(outputPath)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
