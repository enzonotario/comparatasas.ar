import { describe, expect, it } from 'vitest'
import {
  extractFrascosTiers,
  findAccountPlazoTier,
  formatPlazoTierTnaRange,
  isFrascosFondo,
} from './account-plazo-tiers'

describe('account-plazo-tiers', () => {
  const frascosApi = [
    {
      fondo: 'NARANJA X FRASCOS 7-13',
      tna: 0.18,
      tea: 0.1972,
      plazoMinDias: 7,
      plazoMaxDias: 13,
    },
    {
      fondo: 'NARANJA X FRASCOS 14-27',
      tna: 0.18,
      tea: 0.1972,
      plazoMinDias: 14,
      plazoMaxDias: 27,
    },
    {
      fondo: 'NARANJA X FRASCOS 28',
      tna: 0.19,
      tea: 0.2092,
      plazoMinDias: 28,
      plazoMaxDias: 28,
    },
  ]

  it('detects frascos fondos', () => {
    expect(isFrascosFondo('NARANJA X FRASCOS 28')).toBe(true)
    expect(isFrascosFondo('NARANJA X')).toBe(false)
  })

  it('extracts and sorts frascos tiers', () => {
    const tiers = extractFrascosTiers(frascosApi)
    expect(tiers).toHaveLength(3)
    expect(tiers[0]?.plazoMinDias).toBe(7)
    expect(tiers[2]?.plazoMaxDias).toBe(28)
  })

  it('finds tier by simulator days', () => {
    const tiers = extractFrascosTiers(frascosApi)
    expect(findAccountPlazoTier(tiers, 10)?.tna).toBe(0.18)
    expect(findAccountPlazoTier(tiers, 20)?.tna).toBe(0.18)
    expect(findAccountPlazoTier(tiers, 28)?.tna).toBe(0.19)
    expect(findAccountPlazoTier(tiers, 5)).toBeNull()
  })

  it('formats tna range', () => {
    const tiers = extractFrascosTiers(frascosApi)
    expect(formatPlazoTierTnaRange(tiers)).toBe('18.00% – 19.00%')
  })
})
