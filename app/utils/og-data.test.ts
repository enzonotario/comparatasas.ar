import { describe, it, expect } from 'vitest'
import {
  formatTna,
  formatApy,
  calcFundTna,
  top3Accounts,
  top3PlazosFijos,
  top3Funds,
  top3Crypto,
  top3Hipotecarios,
} from './og-data'

describe('formatTna', () => {
  it('formats a percentage with one decimal', () => {
    expect(formatTna(85.2)).toBe('85.2% TNA')
  })

  it('rounds to one decimal place', () => {
    expect(formatTna(85.25)).toBe('85.3% TNA')
  })

  it('formats zero', () => {
    expect(formatTna(0)).toBe('0.0% TNA')
  })
})

describe('formatApy', () => {
  it('formats APY with one decimal', () => {
    expect(formatApy(12.5)).toBe('12.5% APY')
  })

  it('rounds to one decimal place', () => {
    expect(formatApy(12.55)).toBe('12.6% APY')
  })
})

describe('calcFundTna', () => {
  it('calculates annualized TNA from VCP values', () => {
    const tna = calcFundTna(1.01, 1.0, 4)
    expect(tna).toBeCloseTo(0.9125, 3)
  })

  it('returns 0 when days is 0', () => {
    expect(calcFundTna(1.01, 1.0, 0)).toBe(0)
  })

  it('returns 0 when olderVcp is 0', () => {
    expect(calcFundTna(1.01, 0, 4)).toBe(0)
  })

  it('returns 0 when days is negative', () => {
    expect(calcFundTna(1.01, 1.0, -1)).toBe(0)
  })
})

describe('top3Accounts', () => {
  const data = [
    { fondo: 'FIWIND', tna: 90 },
    { fondo: 'NARANJA X', tna: 85 },
    { fondo: 'UALA', tna: 80 },
    { fondo: 'CARREFOUR BANCO', tna: 75 },
    { fondo: 'BELO', tna: 95 },
    { fondo: 'OTRO', tna: 99 },
  ]

  it('returns top 3 by TNA descending', () => {
    const result = top3Accounts(data)
    expect(result).toHaveLength(3)
    expect(result[0]!.name).toBe('FIWIND')
    expect(result[1]!.name).toBe('NARANJA X')
    expect(result[2]!.name).toBe('UALA')
  })

  it('excludes blacklisted accounts (BELO)', () => {
    const result = top3Accounts(data)
    expect(result.map((r) => r.name)).not.toContain('BELO')
  })

  it('excludes accounts not in the allowed list', () => {
    const result = top3Accounts(data)
    expect(result.map((r) => r.name)).not.toContain('OTRO')
  })

  it('formats rate correctly', () => {
    const result = top3Accounts(data)
    expect(result[0]!.rate).toBe('90.0% TNA')
  })

  it('returns fewer than 3 if not enough data', () => {
    const result = top3Accounts([{ fondo: 'FIWIND', tna: 90 }])
    expect(result).toHaveLength(1)
  })
})

describe('top3PlazosFijos', () => {
  const data = [
    { entidad: 'Banco A', tnaClientes: 0.85 },
    { entidad: 'Banco B', tnaClientes: 0.8 },
    { entidad: 'Banco C', tnaClientes: 0.75 },
    { entidad: 'Banco D', tnaClientes: 0.7 },
    { entidad: 'Banco E', tnaClientes: 0 },
  ]

  it('returns top 3 by tnaClientes descending', () => {
    const result = top3PlazosFijos(data)
    expect(result).toHaveLength(3)
    expect(result[0]!.name).toBe('Banco A')
    expect(result[1]!.name).toBe('Banco B')
    expect(result[2]!.name).toBe('Banco C')
  })

  it('excludes items with tnaClientes = 0', () => {
    const result = top3PlazosFijos(data)
    expect(result.map((r) => r.name)).not.toContain('Banco E')
  })

  it('formats rate by multiplying by 100', () => {
    const result = top3PlazosFijos(data)
    expect(result[0]!.rate).toBe('85.0% TNA')
  })
})

describe('top3Funds', () => {
  const funds = [
    { fondo: 'Fondo A', displayName: 'Fondo A', tna: 0.5 },
    { fondo: 'Fondo B', displayName: 'Fondo B', tna: 0.4 },
    { fondo: 'Fondo C', displayName: 'Fondo C', tna: 0.3 },
    { fondo: 'Fondo D', displayName: 'Fondo D', tna: 0.2 },
  ]

  it('returns top 3 funds by TNA', () => {
    const result = top3Funds(funds)
    expect(result).toHaveLength(3)
    expect(result[0]!.name).toBe('Fondo A')
    expect(result[1]!.name).toBe('Fondo B')
    expect(result[2]!.name).toBe('Fondo C')
  })

  it('excludes funds beyond top 3', () => {
    const result = top3Funds(funds)
    expect(result.map((r) => r.name)).not.toContain('Fondo D')
  })

  it('formats rate as percentage TNA', () => {
    const result = top3Funds(funds)
    expect(result[0]!.rate).toMatch(/^\d+(\.\d+)?% TNA$/)
  })

  it('uses displayName when present', () => {
    const withDisplay = [{ fondo: 'x', displayName: 'Nombre visible', tna: 0.1 }]
    const result = top3Funds(withDisplay)
    expect(result[0]!.name).toBe('Nombre visible')
  })
})

describe('top3Crypto', () => {
  const data = [
    {
      entidad: 'Exchange A',
      rendimientos: [
        { moneda: 'BTC', apy: 5.5 },
        { moneda: 'ETH', apy: 4.0 },
      ],
    },
    { entidad: 'Exchange B', rendimientos: [{ moneda: 'USDT', apy: 12.0 }] },
    { entidad: 'Exchange C', rendimientos: [{ moneda: 'BTC', apy: 3.0 }] },
    { entidad: 'Exchange D', rendimientos: [{ moneda: 'DAI', apy: 8.0 }] },
    { entidad: 'Exchange E', rendimientos: [{ moneda: 'ETH', apy: 0 }] },
  ]

  it('returns top 3 by max APY descending', () => {
    const result = top3Crypto(data)
    expect(result).toHaveLength(3)
    expect(result[0]!.name).toBe('Exchange B')
    expect(result[1]!.name).toBe('Exchange D')
    expect(result[2]!.name).toBe('Exchange A')
  })

  it('excludes entities with maxApy = 0', () => {
    const result = top3Crypto(data)
    expect(result.map((r) => r.name)).not.toContain('Exchange E')
  })

  it('uses the max APY across rendimientos per entity', () => {
    const result = top3Crypto(data)
    const exchangeA = result.find((r) => r.name === 'Exchange A')
    expect(exchangeA!.rate).toBe('5.5% APY')
  })
})

describe('top3Hipotecarios', () => {
  const data = [
    { nombreComercial: 'Banco A', tna: 5.0 },
    { nombreComercial: 'Banco B', tna: 4.5 },
    { nombreComercial: 'Banco C', tna: 6.0 },
    { nombreComercial: 'Banco D', tna: 3.5 },
  ]

  it('returns top 3 sorted by lowest TNA (best mortgage rate)', () => {
    const result = top3Hipotecarios(data)
    expect(result).toHaveLength(3)
    expect(result[0]!.name).toBe('Banco D')
    expect(result[1]!.name).toBe('Banco B')
    expect(result[2]!.name).toBe('Banco A')
  })

  it('formats rate correctly', () => {
    const result = top3Hipotecarios(data)
    expect(result[0]!.rate).toBe('3.5% TNA')
  })
})
