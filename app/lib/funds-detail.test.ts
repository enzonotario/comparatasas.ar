import { describe, expect, it } from 'vitest'
import {
  getFundDetailPath,
  getFundDetailTo,
  getFundDetailToOptionsFromRoute,
  normalizeFundSlug,
} from './funds-detail'

describe('normalizeFundSlug', () => {
  it('matches Argentina Datos for Ley 27.743 (dot is stripped, not hyphenated)', () => {
    expect(normalizeFundSlug('Vinci Compass Liquidez - Clase H Ley 27.743')).toBe(
      'vinci-compass-liquidez-clase-h-ley-27743',
    )
  })

  it('strips ordinal marks in N° / Nº without inventing hyphens', () => {
    expect(normalizeFundSlug('1822 Raices Dólares Plus - Clase B Ley N° 27.743')).toBe(
      '1822-raices-dolares-plus-clase-b-ley-n-27743',
    )
    expect(normalizeFundSlug('Adcap Acciones - Clase Ley Nº 27.743')).toBe(
      'adcap-acciones-clase-ley-n-27743',
    )
  })

  it('collapses spaces and punctuation into single hyphens', () => {
    expect(normalizeFundSlug('Fima Premium - Clase A')).toBe('fima-premium-clase-a')
  })

  it('builds detail paths from names', () => {
    expect(getFundDetailPath('Vinci Compass Liquidez - Clase H Ley 27.743')).toBe(
      '/fondos/vinci-compass-liquidez-clase-h-ley-27743',
    )
  })
})

describe('getFundDetailTo', () => {
  const slug = 'fima-premium-clase-a'

  it('returns resumen path without query by default', () => {
    expect(getFundDetailTo(slug)).toBe('/fondos/fima-premium-clase-a')
  })

  it('returns historico sibling route without query.tab', () => {
    expect(getFundDetailTo(slug, { tab: 'historico' })).toBe('/fondos/fima-premium-clase-a/historico')
  })

  it('preserves non-default periodo in query on historico route', () => {
    expect(getFundDetailTo(slug, { tab: 'historico', periodo: '3m' })).toEqual({
      path: '/fondos/fima-premium-clase-a/historico',
      query: { periodo: '3m' },
    })
  })

  it('omits default periodo from query', () => {
    expect(getFundDetailTo(slug, { tab: 'historico', periodo: '1y' })).toBe(
      '/fondos/fima-premium-clase-a/historico',
    )
  })
})

describe('getFundDetailToOptionsFromRoute', () => {
  it('detects historico tab from path', () => {
    expect(
      getFundDetailToOptionsFromRoute({
        path: '/fondos/fima-premium-clase-a/historico',
        query: {},
      }),
    ).toEqual({ tab: 'historico', periodo: undefined })
  })

  it('detects resumen tab from index path', () => {
    expect(
      getFundDetailToOptionsFromRoute({
        path: '/fondos/fima-premium-clase-a',
        query: { periodo: '6m' },
      }),
    ).toEqual({ tab: undefined, periodo: '6m' })
  })
})
