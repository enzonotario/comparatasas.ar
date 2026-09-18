import { describe, expect, it } from 'vitest'
import {
  dataZoomPercentToZoomRange,
  isFullDataZoomPercent,
  zoomRangeToDataZoomPercent,
} from './useAccountHistoryChartZoomSync'

describe('zoomRangeToDataZoomPercent', () => {
  it('devuelve 0-100 sin rango o sin datos', () => {
    expect(zoomRangeToDataZoomPercent(null, 10)).toEqual({ start: 0, end: 100 })
    expect(zoomRangeToDataZoomPercent({ start: 2, end: 8 }, 0)).toEqual({ start: 0, end: 100 })
  })

  it('convierte índices (end exclusivo) a porcentajes', () => {
    expect(zoomRangeToDataZoomPercent({ start: 25, end: 75 }, 100)).toEqual({
      start: 25,
      end: 75,
    })
  })
})

describe('dataZoomPercentToZoomRange', () => {
  it('convierte porcentajes a índices (end exclusivo)', () => {
    expect(dataZoomPercentToZoomRange(25, 75, 100)).toEqual({ start: 25, end: 75 })
  })

  it('clampa fuera de rango', () => {
    expect(dataZoomPercentToZoomRange(-10, 120, 50)).toEqual({ start: 0, end: 50 })
  })
})

describe('isFullDataZoomPercent', () => {
  it('detecta ventana completa', () => {
    expect(isFullDataZoomPercent(0, 100)).toBe(true)
    expect(isFullDataZoomPercent(0.01, 99.99)).toBe(true)
    expect(isFullDataZoomPercent(10, 90)).toBe(false)
  })
})
