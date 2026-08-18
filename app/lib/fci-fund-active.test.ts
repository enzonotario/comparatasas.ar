import { describe, expect, it } from 'vitest'
import { FUND_ACTIVE_REPORT_MAX_AGE_DAYS, isFundReportActive } from './fci-fund-active'

describe('isFundReportActive', () => {
  const now = new Date(2026, 7, 17)

  it('treats a report from today as active', () => {
    expect(isFundReportActive('2026-08-17', { now })).toBe(true)
  })

  it('treats a report on the max-age boundary as active', () => {
    expect(isFundReportActive('2026-07-18', { now })).toBe(true)
    expect(FUND_ACTIVE_REPORT_MAX_AGE_DAYS).toBe(30)
  })

  it('treats an older report as inactive', () => {
    expect(isFundReportActive('2026-07-17', { now })).toBe(false)
  })

  it('rejects missing or invalid dates', () => {
    expect(isFundReportActive(null, { now })).toBe(false)
    expect(isFundReportActive(undefined, { now })).toBe(false)
    expect(isFundReportActive('', { now })).toBe(false)
    expect(isFundReportActive('no-es-fecha', { now })).toBe(false)
  })
})
