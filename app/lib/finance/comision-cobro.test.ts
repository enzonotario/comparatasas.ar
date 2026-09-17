import { describe, expect, it } from 'vitest'
import { IVA_COMISION_COBRO, simulateComisionCobro } from './comision-cobro'

describe('simulateComisionCobro', () => {
  it('calcula arancel sin IVA', () => {
    const result = simulateComisionCobro({
      monto: 100_000,
      arancel: 0.008,
      ivaAdicional: false,
      sumarIva: true,
    })

    expect(result).toEqual({
      arancelBase: 800,
      iva: 0,
      costo: 800,
      neto: 99_200,
      costoEfectivoRate: 0.008,
    })
  })

  it('suma IVA 21% cuando aplica y el usuario lo pide', () => {
    const result = simulateComisionCobro({
      monto: 100_000,
      arancel: 0.01,
      ivaAdicional: true,
      sumarIva: true,
    })

    expect(result?.arancelBase).toBe(1000)
    expect(result?.iva).toBeCloseTo(1000 * IVA_COMISION_COBRO)
    expect(result?.costo).toBeCloseTo(1000 * (1 + IVA_COMISION_COBRO))
    expect(result?.neto).toBeCloseTo(100_000 - 1000 * (1 + IVA_COMISION_COBRO))
    expect(result?.costoEfectivoRate).toBeCloseTo(0.01 * (1 + IVA_COMISION_COBRO))
  })

  it('no suma IVA si el usuario lo desactiva', () => {
    const result = simulateComisionCobro({
      monto: 50_000,
      arancel: 0.02,
      ivaAdicional: true,
      sumarIva: false,
    })

    expect(result).toEqual({
      arancelBase: 1000,
      iva: 0,
      costo: 1000,
      neto: 49_000,
      costoEfectivoRate: 0.02,
    })
  })

  it('retorna null si no hay arancel o monto inválido', () => {
    expect(
      simulateComisionCobro({
        monto: 100_000,
        arancel: null,
        ivaAdicional: true,
        sumarIva: true,
      }),
    ).toBeNull()

    expect(
      simulateComisionCobro({
        monto: 0,
        arancel: 0.01,
        ivaAdicional: true,
        sumarIva: true,
      }),
    ).toBeNull()
  })
})
