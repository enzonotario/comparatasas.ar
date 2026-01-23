import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.GA_PROPERTY_ID = '123456789'
})

const { getDateRange, fetchAnalyticsData, saveEvents, initializeDatabase } =
  await import('./sync-analytics')

describe('getDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
  })

  it('returns correct date range for 7 days back', () => {
    const { startDate, endDate } = getDateRange(7)
    expect(startDate).toBe('2024-01-08')
    expect(endDate).toBe('2024-01-15')
  })

  it('returns correct date range for 1 day back', () => {
    const { startDate, endDate } = getDateRange(1)
    expect(startDate).toBe('2024-01-14')
    expect(endDate).toBe('2024-01-15')
  })

  it('returns correct date range for 30 days back', () => {
    const { startDate, endDate } = getDateRange(30)
    expect(startDate).toBe('2023-12-16')
    expect(endDate).toBe('2024-01-15')
  })
})

describe('fetchAnalyticsData', () => {
  it('parses GA4 response correctly', async () => {
    const mockClient = {
      runReport: vi.fn().mockResolvedValue([
        {
          rows: [
            {
              dimensionValues: [
                { value: '20240115' },
                { value: 'provider_click' },
                { value: 'https://uala.com.ar' },
                { value: 'true' },
              ],
              metricValues: [{ value: '42' }],
            },
            {
              dimensionValues: [
                { value: '20240115' },
                { value: 'sponsor_click' },
                { value: 'https://dolarapp.com' },
                { value: 'true' },
              ],
              metricValues: [{ value: '15' }],
            },
          ],
        },
      ]),
    }

    const events = await fetchAnalyticsData(mockClient as any, '2024-01-08', '2024-01-15')

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({
      date: '20240115',
      eventName: 'provider_click',
      providerName: 'https://uala.com.ar',
      section: 'true',
      contentType: '',
      eventCount: 42,
    })
    expect(events[1]).toEqual({
      date: '20240115',
      eventName: 'sponsor_click',
      providerName: 'https://dolarapp.com',
      section: 'true',
      contentType: '',
      eventCount: 15,
    })
  })

  it('handles empty response', async () => {
    const mockClient = {
      runReport: vi.fn().mockResolvedValue([{ rows: null }]),
    }

    const events = await fetchAnalyticsData(mockClient as any, '2024-01-08', '2024-01-15')

    expect(events).toHaveLength(0)
  })

  it('handles missing dimension values', async () => {
    const mockClient = {
      runReport: vi.fn().mockResolvedValue([
        {
          rows: [
            {
              dimensionValues: [{ value: '20240115' }],
              metricValues: [{ value: '10' }],
            },
          ],
        },
      ]),
    }

    const events = await fetchAnalyticsData(mockClient as any, '2024-01-08', '2024-01-15')

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({
      date: '20240115',
      eventName: '',
      providerName: '',
      section: '',
      contentType: '',
      eventCount: 10,
    })
  })

  it('calls runReport with correct parameters', async () => {
    const mockClient = {
      runReport: vi.fn().mockResolvedValue([{ rows: [] }]),
    }

    await fetchAnalyticsData(mockClient as any, '2024-01-01', '2024-01-07')

    expect(mockClient.runReport).toHaveBeenCalledWith(
      expect.objectContaining({
        property: 'properties/123456789',
        dateRanges: [{ startDate: '2024-01-01', endDate: '2024-01-07' }],
      }),
    )
  })
})

describe('initializeDatabase', () => {
  it('creates table and indexes', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue({}),
    }

    await initializeDatabase(mockDb as any)

    expect(mockDb.execute).toHaveBeenCalledTimes(3)
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS analytics_events'),
    )
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_events_date'),
    )
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_events_provider'),
    )
  })
})

describe('saveEvents', () => {
  it('inserts events with upsert', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue({}),
    }

    const events = [
      {
        date: '20240115',
        eventName: 'provider_click',
        providerName: 'https://uala.com.ar',
        section: 'true',
        contentType: '',
        eventCount: 10,
      },
    ]

    await saveEvents(mockDb as any, events)

    expect(mockDb.execute).toHaveBeenCalledWith({
      sql: expect.stringContaining('INSERT INTO analytics_events'),
      args: ['20240115', 'provider_click', 'https://uala.com.ar', 'true', '', 10],
    })
  })

  it('handles multiple events', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue({}),
    }

    const events = [
      {
        date: '20240115',
        eventName: 'provider_click',
        providerName: 'https://uala.com.ar',
        section: 'true',
        contentType: '',
        eventCount: 10,
      },
      {
        date: '20240115',
        eventName: 'sponsor_click',
        providerName: 'https://dolarapp.com',
        section: 'true',
        contentType: '',
        eventCount: 5,
      },
    ]

    await saveEvents(mockDb as any, events)

    expect(mockDb.execute).toHaveBeenCalledTimes(2)
  })

  it('handles empty events array', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue({}),
    }

    await saveEvents(mockDb as any, [])

    expect(mockDb.execute).not.toHaveBeenCalled()
  })
})
