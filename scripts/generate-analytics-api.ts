import 'dotenv/config'
import { createClient } from '@libsql/client'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

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
      provider_name as provider,
      SUM(event_count) as total_clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name
    ORDER BY total_clicks DESC
  `)
  return result.rows
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
      provider_name as provider,
      SUM(event_count) as total_clicks,
      COUNT(DISTINCT date) as days_active
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name
    ORDER BY total_clicks DESC
    LIMIT ${limit}
  `)
  return result.rows
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
      provider_name as provider,
      SUM(event_count) as clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY date, provider_name
    ORDER BY date DESC, clicks DESC
  `)
  return result.rows
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
      provider_name as provider,
      event_name as event_type,
      SUM(event_count) as total_clicks,
      ROUND(AVG(event_count), 2) as avg_daily_clicks
    FROM analytics_events
    WHERE provider_name IS NOT NULL AND provider_name != ''
    GROUP BY provider_name, event_name
    ORDER BY total_clicks DESC
  `)
  return result.rows
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
