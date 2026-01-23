import 'dotenv/config'
import { createClient } from '@libsql/client'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { institutions } from '../app/lib/mappings/institutions'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

const db = createClient({
  url: getEnv('TURSO_URL'),
  authToken: getEnv('TURSO_AUTH_TOKEN'),
})

const OUTPUT_DIR = join(process.cwd(), 'public', 'api', 'analytics')

// Construir el mapa URL -> shortName desde institutions
// Solo toma el primer valor encontrado para cada URL (evita sobrescribir con variantes como "Ualá Plus")
const URL_TO_PROVIDER_FROM_INSTITUTIONS: Record<string, string> = {}
for (const inst of institutions) {
  if (inst.url && inst.url !== '#' && !URL_TO_PROVIDER_FROM_INSTITUTIONS[inst.url]) {
    URL_TO_PROVIDER_FROM_INSTITUTIONS[inst.url] = inst.shortName
  }
}

// URLs adicionales que no están en institutions.ts
// (sitios externos, variantes de URLs, o providers específicos)
const EXTRA_URL_TO_PROVIDER: Record<string, string> = {
  // Variantes de DolarApp
  'https://www.dolarapp.com/es-AR?utm_source=comparatasas&utm_medium=banner&utm_campaign=comparatasas_a': 'DolarApp',
  'https://www.dolarapp.com/es-AR?utm_source=comparatasas&utm_medium=banner&utm_campaign=comparatasas_ad': 'DolarApp',
  // Providers con URLs directos (no dub.link)
  'https://bancodecomercio.com.ar/plazo-fijo-web': 'Banco de Comercio',
  'https://www.creditoregional.com.ar/solplazofijoweb.html': 'Crédito Regional',
  'https://plazofijo.bancobica.com.ar/': 'Banco BICA',
  'https://www.reba.com.ar/plazo-fijo/?utm_source=web&utm_medium=bcra&utm_campaign=cantidad-visitas-bcr': 'Reba',
  'https://www.btf.com.ar/contacto/solicitud_pf_web/': 'BTF',
  // Sitios externos/relacionados
  'https://comparadolar.ar/': 'ComparaDolar',
  'https://comparapix.ar/': 'ComparaPix',
  'https://enqueinvierto.ar/': 'EnQueInvierto',
  'https://betece.app/': 'Betece',
  'https://icons.com.ar/': 'Icons',
  'https://www.cafci.org.ar/': 'CAFCI',
  'https://github.com/enzonotario/comparatasas.ar': 'GitHub',
  'https://cafecito.app/enzonotario': 'Cafecito',
  'https://cafecito.app/salinaseconomia1': 'Cafecito Salinas',
  'https://x.com/SalinasAndres': 'X Salinas',
  // Providers adicionales
  'https://dub.link/cCOI35S': 'Cuenta DNI',
  'https://dub.link/asxwg8M': 'Modo',
  'https://dub.link/l58DNjJ': 'Plus Pagos',
  'https://dub.link/dh8pB0R': 'Openbank',
}

// Combinar ambos mapas
const URL_TO_PROVIDER: Record<string, string> = {
  ...URL_TO_PROVIDER_FROM_INSTITUTIONS,
  ...EXTRA_URL_TO_PROVIDER,
}

function getProviderName(url: string): string {
  if (URL_TO_PROVIDER[url]) {
    return URL_TO_PROVIDER[url]
  }
  for (const [key, value] of Object.entries(URL_TO_PROVIDER)) {
    if (url.startsWith(key.split('?')[0])) {
      return value
    }
  }
  try {
    const hostname = new URL(url).hostname.replace('www.', '').replace('.com.ar', '').replace('.ar', '')
    return hostname.charAt(0).toUpperCase() + hostname.slice(1)
  } catch {
    return url
  }
}

interface QueryResult {
  rows: Record<string, unknown>[]
}

async function query(sql: string): Promise<QueryResult> {
  const result = await db.execute(sql)
  return {
    rows: result.rows.map((row) => {
      const obj: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        obj[key] = value
      }
      return obj
    }),
  }
}

async function generateClicksByProvider() {
  const result = await query(`
    SELECT
      provider_name as provider_url,
      SUM(event_count) as total_clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name
    ORDER BY total_clicks DESC
  `)
  const aggregated: Record<string, number> = {}
  for (const row of result.rows) {
    const name = getProviderName(row.provider_url as string)
    aggregated[name] = (aggregated[name] || 0) + (row.total_clicks as number)
  }
  return Object.entries(aggregated)
    .map(([provider, total_clicks]) => ({ provider, total_clicks }))
    .sort((a, b) => b.total_clicks - a.total_clicks)
}

async function generateClicksByDate() {
  const result = await query(`
    SELECT
      date,
      SUM(event_count) as total_clicks
    FROM analytics_events
    GROUP BY date
    ORDER BY date DESC
    LIMIT 30
  `)
  return result.rows
}

async function generateClicksByEventType() {
  const result = await query(`
    SELECT
      event_name as event_type,
      SUM(event_count) as total_clicks
    FROM analytics_events
    GROUP BY event_name
    ORDER BY total_clicks DESC
  `)
  return result.rows
}

async function generateTopProviders(limit: number = 10) {
  const result = await query(`
    SELECT
      provider_name as provider_url,
      SUM(event_count) as total_clicks,
      COUNT(DISTINCT date) as days_active
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name
    ORDER BY total_clicks DESC
  `)
  const aggregated: Record<string, { total_clicks: number; days_active: number }> = {}
  for (const row of result.rows) {
    const name = getProviderName(row.provider_url as string)
    if (!aggregated[name]) {
      aggregated[name] = { total_clicks: 0, days_active: 0 }
    }
    aggregated[name].total_clicks += row.total_clicks as number
    aggregated[name].days_active = Math.max(aggregated[name].days_active, row.days_active as number)
  }
  return Object.entries(aggregated)
    .map(([provider, data]) => ({ provider, ...data }))
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .slice(0, limit)
}

async function generateDailyTrend() {
  const result = await query(`
    SELECT
      date,
      event_name as event_type,
      SUM(event_count) as clicks
    FROM analytics_events
    GROUP BY date, event_name
    ORDER BY date DESC
    LIMIT 90
  `)
  return result.rows
}

async function generateProviderTrend() {
  const result = await query(`
    SELECT
      date,
      provider_name as provider_url,
      SUM(event_count) as clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY date, provider_name
    ORDER BY date DESC, clicks DESC
  `)
  return result.rows.map((row) => ({
    date: row.date,
    provider: getProviderName(row.provider_url as string),
    clicks: row.clicks,
  }))
}

async function generateSummary() {
  const totals = await query(`
    SELECT
      COUNT(*) as total_records,
      SUM(event_count) as total_clicks,
      COUNT(DISTINCT provider_name) as unique_providers,
      COUNT(DISTINCT date) as days_tracked,
      MIN(date) as first_date,
      MAX(date) as last_date
    FROM analytics_events
  `)

  const byEventType = await generateClicksByEventType()
  const topProviders = await generateTopProviders(5)

  return {
    ...totals.rows[0],
    by_event_type: byEventType,
    top_providers: topProviders,
    generated_at: new Date().toISOString(),
  }
}

async function generateHourlyPattern() {
  const result = await query(`
    SELECT
      date,
      SUM(event_count) as clicks
    FROM analytics_events
    GROUP BY date
    ORDER BY date
  `)
  return result.rows
}

async function generateProviderComparison() {
  const result = await query(`
    SELECT
      provider_name as provider_url,
      event_name as event_type,
      SUM(event_count) as total_clicks,
      ROUND(AVG(event_count), 2) as avg_daily_clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name, event_name
    ORDER BY total_clicks DESC
  `)
  return result.rows.map((row) => ({
    provider: getProviderName(row.provider_url as string),
    event_type: row.event_type,
    total_clicks: row.total_clicks,
    avg_daily_clicks: row.avg_daily_clicks,
  }))
}

async function writeJson(filename: string, data: unknown) {
  const filepath = join(OUTPUT_DIR, filename)
  await writeFile(filepath, JSON.stringify(data, null, 2))
  console.log(`Generated: ${filepath}`)
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const endpoints = [
    { name: 'summary.json', fn: generateSummary },
    { name: 'clicks-by-provider.json', fn: generateClicksByProvider },
    { name: 'clicks-by-date.json', fn: generateClicksByDate },
    { name: 'clicks-by-event-type.json', fn: generateClicksByEventType },
    { name: 'top-providers.json', fn: () => generateTopProviders(10) },
    { name: 'daily-trend.json', fn: generateDailyTrend },
    { name: 'provider-trend.json', fn: generateProviderTrend },
    { name: 'provider-comparison.json', fn: generateProviderComparison },
  ]

  for (const endpoint of endpoints) {
    const data = await endpoint.fn()
    await writeJson(endpoint.name, data)
  }

  db.close()
  console.log('All analytics endpoints generated')
}

main().catch((error) => {
  console.error('Failed to generate analytics:', error)
  process.exit(1)
})
