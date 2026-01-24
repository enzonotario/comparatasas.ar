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
  // Páginas Amigas (friendlyPages)
  'https://comparadolar.ar/': 'comparadolar.ar',
  'https://comparadolar.ar': 'comparadolar.ar',
  'https://comparapix.ar/': 'comparapix.ar',
  'https://comparapix.ar': 'comparapix.ar',
  'https://icons.com.ar/': 'icons.com.ar',
  'https://icons.com.ar': 'icons.com.ar',
  'https://enqueinvierto.ar/': 'enqueinvierto.ar',
  'https://enqueinvierto.ar': 'enqueinvierto.ar',
  'https://betece.app/': 'betece.app',
  'https://betece.app': 'betece.app',
  'https://dub.link/asxwg8M': 'dolarya.info', // dolarya.info via dub.link
  'https://dub.link/l58DNjJ': 'argentinadatos.com', // argentinadatos via dub.link
  'https://dub.link/cCOI35S': 'dolarito.ar', // dolarito via dub.link
  'https://dub.link/dh8pB0R': 'impuestito.org', // impuestito via dub.link
  // Recursos externos (no páginas amigas)
  'https://www.cafci.org.ar/': 'CAFCI',
  'https://github.com/enzonotario/comparatasas.ar': 'GitHub',
  'https://cafecito.app/enzonotario': 'Cafecito',
  'https://cafecito.app/salinaseconomia1': 'Cafecito Salinas',
  'https://x.com/SalinasAndres': 'X Salinas',
}

// Lista de páginas amigas (para categorización)
const FRIENDLY_PAGES = new Set([
  'comparadolar.ar',
  'comparapix.ar',
  'icons.com.ar',
  'dolarya.info',
  'argentinadatos.com',
  'dolarito.ar',
  'impuestito.org',
  'enqueinvierto.ar',
  'betece.app',
])

// Combinar ambos mapas
const URL_TO_PROVIDER: Record<string, string> = {
  ...URL_TO_PROVIDER_FROM_INSTITUTIONS,
  ...EXTRA_URL_TO_PROVIDER,
}

// Mapeo de provider a categoría para datos legacy (eventos 'click' sin content_type)
// Las categorías son los badges/typeLabels que se muestran en la app
// Basado en useAccounts.ts y usePlazosFijos.ts
const PROVIDER_TO_CATEGORY: Record<string, string> = {
  // Cuentas Remuneradas (según useAccounts.ts)
  'Ualá': 'Cuenta Remunerada',
  'Carrefour Banco': 'Cuenta Remunerada',
  'Naranja X': 'Cuenta Remunerada',
  'Supervielle': 'Cuenta Remunerada',
  'Cresium': 'Cuenta Remunerada',
  'Openbank': 'Cuenta Remunerada',
  'Reba': 'Cuenta Remunerada',
  'Banco Nación': 'Cuenta Remunerada', // BNA tiene cuenta remunerada
  // Billeteras (según useAccounts.ts: FIWIND y BELO son billeteras)
  'Fiwind': 'Billetera',
  'Belo': 'Billetera',
  'Mercado Pago': 'Billetera',
  'Personal Pay': 'Billetera',
  'Cuenta DNI': 'Billetera',
  'Modo': 'Billetera',
  'Claro Pay': 'Billetera',
  'Prex': 'Billetera',
  'Lemon': 'Billetera',
  'Buenbit': 'Billetera',
  'Ripio': 'Billetera',
  'SatoshiTango': 'Billetera',
  'AstroPay': 'Billetera',
  'Plus Pagos': 'Billetera',
  // Plazos Fijos (bancos que solo ofrecen plazo fijo, no cuenta remunerada)
  'Banco Galicia': 'Plazo Fijo',
  'Banco Santander': 'Plazo Fijo',
  'BBVA': 'Plazo Fijo',
  'Banco Macro': 'Plazo Fijo',
  'ICBC': 'Plazo Fijo',
  'Banco Provincia': 'Plazo Fijo',
  'Banco Ciudad': 'Plazo Fijo',
  'Banco Hipotecario': 'Plazo Fijo',
  'Bancor': 'Plazo Fijo',
  'Banco Credicoop': 'Plazo Fijo',
  'Banco Comafi': 'Plazo Fijo',
  'Banco del Sol': 'Plazo Fijo',
  'Banco Voii': 'Plazo Fijo',
  'Banco Meridian': 'Plazo Fijo',
  'Banco CMF': 'Plazo Fijo',
  'Banco Mariva': 'Plazo Fijo',
  'Bibank': 'Plazo Fijo',
  'Banco Dino': 'Plazo Fijo',
  'Banco Masventas': 'Plazo Fijo',
  'Brubank': 'Plazo Fijo',
  'Banco de Comercio': 'Plazo Fijo',
  'Crédito Regional': 'Plazo Fijo',
  'Banco BICA': 'Plazo Fijo',
  'BTF': 'Plazo Fijo',
  'Toronto': 'Plazo Fijo',
  // FCI Money Market (brokers con FCI)
  'Cocos': 'Money Market',
  'Balanz': 'Money Market',
  'IOL': 'Money Market',
  'IEB+': 'Money Market',
  'Adcap': 'Money Market',
  // Criptomonedas (exchanges)
  'Decrypto': 'Criptomonedas',
  'LucaMoney': 'Criptomonedas',
  'Vesseo': 'Criptomonedas',
  // Páginas Amigas (friendlyPages)
  'comparadolar.ar': 'Página Amiga',
  'comparapix.ar': 'Página Amiga',
  'icons.com.ar': 'Página Amiga',
  'dolarya.info': 'Página Amiga',
  'argentinadatos.com': 'Página Amiga',
  'dolarito.ar': 'Página Amiga',
  'impuestito.org': 'Página Amiga',
  'enqueinvierto.ar': 'Página Amiga',
  'betece.app': 'Página Amiga',
  // Otro (sponsors, recursos externos, redirects, etc.)
  'CAFCI': 'Otro',
  'GitHub': 'Otro',
  'Cafecito': 'Otro',
  'Cafecito Salinas': 'Otro',
  'X Salinas': 'Otro',
  'X (Twitter)': 'Otro',
  'DolarApp': 'Otro',
  'Bit.ly (redirect)': 'Otro',
}

// Normalizar content_type para agrupar categorías similares
// Las categorías son los badges/typeLabels que se muestran en la app
function normalizeCategory(contentType: string): string {
  if (!contentType || contentType === '(not set)') return 'Sin categoría'
  
  // Normalizar variantes
  const normalized = contentType.toLowerCase().trim()
  
  // Cuenta Remunerada
  if (normalized === 'cuenta remunerada' || normalized === 'cuentaremunerada') return 'Cuenta Remunerada'
  if (normalized === 'cuenta remunerada usd') return 'Cuenta Remunerada USD'
  
  // Billetera
  if (normalized === 'billetera') return 'Billetera'
  if (normalized === 'billetera usd') return 'Billetera USD'
  
  // FCI por tipo (badges)
  if (normalized === 'money market' || normalized === 'moneymarket') return 'Money Market'
  if (normalized === 'renta fija' || normalized === 'rentafija') return 'Renta Fija'
  if (normalized === 'renta mixta' || normalized === 'rentamixta') return 'Renta Mixta'
  if (normalized === 'renta variable' || normalized === 'rentavariable') return 'Renta Variable'
  if (normalized === 'fund' || normalized === 'fci') return 'Money Market' // default a Money Market
  
  // Plazo Fijo
  if (normalized === 'plazo fijo 30 días' || normalized === 'plazofijo30d' || normalized === 'plazo fijo') return 'Plazo Fijo'
  
  // Criptomonedas (exchanges y compra/venta)
  if (normalized.startsWith('crypto-')) return 'Criptomonedas'
  if (normalized === 'exchange-card') return 'Criptomonedas'
  
  // Criptopesos (stablecoins en pesos)
  if (normalized === 'criptopeso' || normalized.includes('criptopeso')) return 'Criptopesos'
  // Si tiene un token específico (ej: "DAI", "USDT"), es criptopeso
  if (['dai', 'usdt', 'usdc', 'usd+'].includes(normalized)) return 'Criptopesos'
  
  // General (botones, links genéricos)
  if (normalized === 'button' || normalized === 'link') return 'General'
  
  return contentType
}

// Obtener categoría para un provider (usado para datos legacy)
function getCategoryForProvider(providerName: string): string {
  // Primero verificar si es una página amiga
  if (FRIENDLY_PAGES.has(providerName)) {
    return 'Página Amiga'
  }
  return PROVIDER_TO_CATEGORY[providerName] || 'Otro'
}

// Mapeo de hostnames a nombres de providers (para URLs no mapeadas directamente)
const HOSTNAME_TO_PROVIDER: Record<string, string> = {
  'cocos.capital': 'Cocos',
  'uala.com.ar': 'Ualá',
  'uala.ar': 'Ualá',
  'mercadopago.com.ar': 'Mercado Pago',
  'mercadopago.com': 'Mercado Pago',
  'naranjax.com': 'Naranja X',
  'personalpay.com.ar': 'Personal Pay',
  'modo.com.ar': 'Modo',
  'claropay.com.ar': 'Claro Pay',
  'prex.com': 'Prex',
  'fiwind.io': 'Fiwind',
  'bfrbank.com': 'Brubank',
  'brubank.com.ar': 'Brubank',
  'galicia.ar': 'Banco Galicia',
  'santander.com.ar': 'Banco Santander',
  'bbva.com.ar': 'BBVA',
  'macro.com.ar': 'Banco Macro',
  'icbc.com.ar': 'ICBC',
  'bancoprovincia.com.ar': 'Banco Provincia',
  'bancociudad.com.ar': 'Banco Ciudad',
  'hipotecario.com.ar': 'Banco Hipotecario',
  'lemon.me': 'Lemon',
  'buenbit.com': 'Buenbit',
  'ripio.com': 'Ripio',
  'satoshitango.com': 'SatoshiTango',
  'astropay.com': 'AstroPay',
  'balanz.com': 'Balanz',
  'invertironline.com': 'IOL',
  'adcap.com.ar': 'Adcap',
  'cocos.com.ar': 'Cocos',
  'belo.app': 'Belo',
  'dolarya.info': 'dolarya.info',
  'comparadolar.ar': 'comparadolar.ar',
  'comparapix.ar': 'comparapix.ar',
  'icons.com.ar': 'icons.com.ar',
  'enqueinvierto.ar': 'enqueinvierto.ar',
  'betece.app': 'betece.app',
  'dolarito.ar': 'dolarito.ar',
  'impuestito.org': 'impuestito.org',
  'argentinadatos.com': 'argentinadatos.com',
  'dolarapp.com': 'DolarApp',
  'bit.ly': 'Bit.ly (redirect)',
  'github.com': 'GitHub',
  'cafecito.app': 'Cafecito',
  'x.com': 'X (Twitter)',
  'twitter.com': 'X (Twitter)',
  'cafci.org.ar': 'CAFCI',
  'decrypto.la': 'Decrypto',
  'lucamoney.com': 'LucaMoney',
  'vesseo.com': 'Vesseo',
}

function getProviderName(url: string): string {
  // Primero intentar match exacto
  if (URL_TO_PROVIDER[url]) {
    return URL_TO_PROVIDER[url]
  }
  
  // Luego intentar match por prefijo (sin query params)
  for (const [key, value] of Object.entries(URL_TO_PROVIDER)) {
    if (url.startsWith(key.split('?')[0])) {
      return value
    }
  }
  
  // Intentar extraer el hostname y buscar en el mapeo
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    
    // Buscar en el mapeo de hostnames
    if (HOSTNAME_TO_PROVIDER[hostname]) {
      return HOSTNAME_TO_PROVIDER[hostname]
    }
    
    // Si no está en el mapeo, formatear el hostname
    const cleanHostname = hostname.replace('.com.ar', '').replace('.com', '').replace('.ar', '')
    return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1)
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

// Generar clicks agrupados por categoría (content_type)
async function generateClicksByCategory() {
  const result = await query(`
    SELECT
      content_type,
      event_name,
      provider_name as provider_url,
      SUM(event_count) as total_clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY content_type, event_name, provider_name
    ORDER BY total_clicks DESC
  `)

  const categories: Record<string, { total_clicks: number; providers: Record<string, number> }> = {}

  for (const row of result.rows) {
    const contentType = row.content_type as string
    const eventName = row.event_name as string
    const providerUrl = row.provider_url as string
    const clicks = row.total_clicks as number
    const providerName = getProviderName(providerUrl)

    // Para eventos nuevos (provider_click), usar el content_type directamente
    // Para eventos legacy (click), inferir la categoría del provider
    let category: string
    if (eventName === 'provider_click' && contentType && contentType !== '(not set)') {
      category = normalizeCategory(contentType)
    } else {
      category = getCategoryForProvider(providerName)
    }

    if (!categories[category]) {
      categories[category] = { total_clicks: 0, providers: {} }
    }
    categories[category].total_clicks += clicks
    categories[category].providers[providerName] = (categories[category].providers[providerName] || 0) + clicks
  }

  // Convertir a array ordenado
  return Object.entries(categories)
    .map(([category, data]) => ({
      category,
      total_clicks: data.total_clicks,
      provider_count: Object.keys(data.providers).length,
      top_providers: Object.entries(data.providers)
        .map(([provider, clicks]) => ({ provider, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5),
    }))
    .sort((a, b) => b.total_clicks - a.total_clicks)
}

// Generar top providers por categoría
async function generateTopProvidersByCategory() {
  const result = await query(`
    SELECT
      content_type,
      event_name,
      provider_name as provider_url,
      SUM(event_count) as total_clicks,
      COUNT(DISTINCT date) as days_active
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY content_type, event_name, provider_name
    ORDER BY total_clicks DESC
  `)

  const categories: Record<string, Array<{ provider: string; total_clicks: number; days_active: number }>> = {}

  for (const row of result.rows) {
    const contentType = row.content_type as string
    const eventName = row.event_name as string
    const providerUrl = row.provider_url as string
    const clicks = row.total_clicks as number
    const daysActive = row.days_active as number
    const providerName = getProviderName(providerUrl)

    let category: string
    if (eventName === 'provider_click' && contentType && contentType !== '(not set)') {
      category = normalizeCategory(contentType)
    } else {
      category = getCategoryForProvider(providerName)
    }

    if (!categories[category]) {
      categories[category] = []
    }

    // Buscar si ya existe el provider en esta categoría
    const existing = categories[category].find((p) => p.provider === providerName)
    if (existing) {
      existing.total_clicks += clicks
      existing.days_active = Math.max(existing.days_active, daysActive)
    } else {
      categories[category].push({ provider: providerName, total_clicks: clicks, days_active: daysActive })
    }
  }

  // Ordenar providers dentro de cada categoría
  for (const category of Object.keys(categories)) {
    categories[category].sort((a, b) => b.total_clicks - a.total_clicks)
  }

  return categories
}

// Generar estadísticas separadas: legacy vs nuevos eventos
async function generateEventTypeStats() {
  const result = await query(`
    SELECT
      event_name,
      CASE 
        WHEN content_type IS NOT NULL AND content_type != '' AND content_type != '(not set)' 
        THEN 'con_categoria' 
        ELSE 'sin_categoria' 
      END as has_category,
      SUM(event_count) as total_clicks,
      COUNT(DISTINCT provider_name) as unique_providers,
      COUNT(DISTINCT date) as days_tracked
    FROM analytics_events
    GROUP BY event_name, has_category
    ORDER BY total_clicks DESC
  `)

  return {
    legacy: result.rows.filter((r) => r.event_name === 'click'),
    new_events: result.rows.filter((r) => r.event_name === 'provider_click' || r.event_name === 'sponsor_click'),
    summary: {
      total_legacy: result.rows
        .filter((r) => r.event_name === 'click')
        .reduce((sum, r) => sum + (r.total_clicks as number), 0),
      total_new: result.rows
        .filter((r) => r.event_name !== 'click')
        .reduce((sum, r) => sum + (r.total_clicks as number), 0),
      with_category: result.rows
        .filter((r) => r.has_category === 'con_categoria')
        .reduce((sum, r) => sum + (r.total_clicks as number), 0),
      without_category: result.rows
        .filter((r) => r.has_category === 'sin_categoria')
        .reduce((sum, r) => sum + (r.total_clicks as number), 0),
    },
  }
}

// Generar clicks por fecha y categoría
async function generateDailyTrendByCategory() {
  const result = await query(`
    SELECT
      date,
      content_type,
      event_name,
      provider_name as provider_url,
      SUM(event_count) as clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY date, content_type, event_name, provider_name
    ORDER BY date DESC
    LIMIT 500
  `)

  const dailyData: Record<string, Record<string, number>> = {}

  for (const row of result.rows) {
    const date = row.date as string
    const contentType = row.content_type as string
    const eventName = row.event_name as string
    const providerUrl = row.provider_url as string
    const clicks = row.clicks as number
    const providerName = getProviderName(providerUrl)

    let category: string
    if (eventName === 'provider_click' && contentType && contentType !== '(not set)') {
      category = normalizeCategory(contentType)
    } else {
      category = getCategoryForProvider(providerName)
    }

    if (!dailyData[date]) {
      dailyData[date] = {}
    }
    dailyData[date][category] = (dailyData[date][category] || 0) + clicks
  }

  // Convertir a array
  return Object.entries(dailyData)
    .map(([date, categories]) => ({
      date,
      categories,
      total: Object.values(categories).reduce((sum, c) => sum + c, 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
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
    // Nuevos endpoints por categoría
    { name: 'clicks-by-category.json', fn: generateClicksByCategory },
    { name: 'top-providers-by-category.json', fn: generateTopProvidersByCategory },
    { name: 'event-type-stats.json', fn: generateEventTypeStats },
    { name: 'daily-trend-by-category.json', fn: generateDailyTrendByCategory },
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
