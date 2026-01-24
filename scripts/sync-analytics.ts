import 'dotenv/config'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { createClient } from '@libsql/client'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

interface AnalyticsEvent {
  date: string
  eventName: string
  providerName: string
  section: string
  contentType: string
  eventCount: number
}

export function createAnalyticsClient() {
  const credentials = JSON.parse(getEnv('GOOGLE_APPLICATION_CREDENTIALS_JSON'))
  return new BetaAnalyticsDataClient({ credentials })
}

export function createTursoClient() {
  return createClient({
    url: getEnv('TURSO_URL'),
    authToken: getEnv('TURSO_AUTH_TOKEN'),
  })
}

export async function initializeDatabase(db: ReturnType<typeof createClient>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      event_name TEXT NOT NULL,
      provider_name TEXT,
      section TEXT,
      content_type TEXT,
      event_count INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, event_name, provider_name, section, content_type)
    )
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_date ON analytics_events(date)
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_provider ON analytics_events(provider_name)
  `)
}

export async function fetchAnalyticsData(
  analyticsClient: BetaAnalyticsDataClient,
  startDate: string,
  endDate: string,
): Promise<AnalyticsEvent[]> {
  const [response] = await analyticsClient.runReport({
    property: `properties/${getEnv('GA_PROPERTY_ID')}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
      { name: 'linkUrl' },
      { name: 'customEvent:section' },
      { name: 'customEvent:content_type' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: 'provider_click' },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: 'sponsor_click' },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: 'click' },
            },
          },
        ],
      },
    },
  })

  const events: AnalyticsEvent[] = []

  if (response.rows) {
    for (const row of response.rows) {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      events.push({
        date: dimensions[0]?.value || '',
        eventName: dimensions[1]?.value || '',
        providerName: dimensions[2]?.value || '',
        section: dimensions[3]?.value || '',
        contentType: dimensions[4]?.value || '',
        eventCount: parseInt(metrics[0]?.value || '0', 10),
      })
    }
  }

  return events
}

export async function saveEvents(db: ReturnType<typeof createClient>, events: AnalyticsEvent[]) {
  for (const event of events) {
    await db.execute({
      sql: `
        INSERT INTO analytics_events (date, event_name, provider_name, section, content_type, event_count)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, event_name, provider_name, section, content_type)
        DO UPDATE SET event_count = excluded.event_count, created_at = CURRENT_TIMESTAMP
      `,
      args: [
        event.date,
        event.eventName,
        event.providerName,
        event.section,
        event.contentType,
        event.eventCount,
      ],
    })
  }
}

export function getDateRange(daysBack: number = 7): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

export async function syncAnalytics(daysBack: number = 7) {
  const analyticsClient = createAnalyticsClient()
  const db = createTursoClient()

  await initializeDatabase(db)

  const { startDate, endDate } = getDateRange(daysBack)
  console.log(`Fetching analytics from ${startDate} to ${endDate}`)

  const events = await fetchAnalyticsData(analyticsClient, startDate, endDate)
  console.log(`Found ${events.length} events`)

  await saveEvents(db, events)
  console.log('Events saved to database')

  db.close()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncAnalytics()
    .then(() => {
      console.log('Sync completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Sync failed:', error)
      process.exit(1)
    })
}
