import { describe, expect, it } from 'vitest'
import {
  getFundMapping,
  LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_F_TOPE,
  LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_G_TOPE,
} from './funds'

describe('fund mapping tope', () => {
  it('declara tope hardcodeado para Lemon / Vinci Compass Liquidez - Clase F', () => {
    expect(LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_F_TOPE).toBe(2_000_000)

    const mapping = getFundMapping('Vinci Compass Liquidez - Clase F')
    const lemon = mapping?.institutions.find((i) => i.institution === 'Lemon')

    expect(lemon?.tope).toBe(LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_F_TOPE)
  })

  it('declara tope hardcodeado para Lemon / Vinci Compass Liquidez - Clase G', () => {
    expect(LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_G_TOPE).toBe(4_000_000)

    const mapping = getFundMapping('Vinci Compass Liquidez - Clase G')
    const lemon = mapping?.institutions.find((i) => i.institution === 'Lemon')

    expect(lemon?.tope).toBe(LEMON_VINCI_COMPASS_LIQUIDEZ_CLASE_G_TOPE)
  })
})
