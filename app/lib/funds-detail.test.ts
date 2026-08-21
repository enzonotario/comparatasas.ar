import { describe, expect, it } from 'vitest'
import { getFundDetailPath, normalizeFundSlug } from './funds-detail'

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
