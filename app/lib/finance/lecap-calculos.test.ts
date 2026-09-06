import { describe, expect, it } from 'vitest'
import {
  aRecibir1VnDesdeMercado,
  calcularFilaLecap,
  gananciaDirectaDecimal,
  precio1VnDesde100,
  precioConComision1Vn,
  temDesdeGananciaDirecta,
  tnaDesdeGananciaDirecta,
} from './lecap-calculos'

describe('lecap-calculos', () => {
  it('deriva a recibir 1VN como en acuantoesta (S15S6)', () => {
    const precio1Vn = precio1VnDesde100(106.68)
    expect(precio1Vn).toBeCloseTo(1.0668, 4)

    const aRecibir = aRecibir1VnDesdeMercado(precio1Vn, 0.229, 8)
    expect(aRecibir).toBeCloseTo(1.0722, 3)

    const conComision = precioConComision1Vn(precio1Vn, 0.15)
    expect(conComision).toBeCloseTo(1.0684, 3)

    const ganancia = gananciaDirectaDecimal(aRecibir, conComision)
    expect(ganancia).toBeCloseTo(0.0035, 3)

    const tna = tnaDesdeGananciaDirecta(ganancia, 8)
    expect(tna).toBeCloseTo(0.16, 1)
  })

  it('calcula fila completa con monto y plazo fijo', () => {
    const fila = calcularFilaLecap(
      { precioArs: 106.68, tnaMercado: 0.229, dias: 8 },
      {
        comisionPorcentaje: 0.15,
        tnaPlazoFijoPorcentaje: 30,
        montoInvertir: 10_000,
      },
    )

    expect(fila.cantidadVn).toBeGreaterThan(0)
    expect(fila.vnARecibir).toBeCloseTo(fila.cantidadVn, 10)
    expect(fila.vnARecibir).toBeCloseTo(10_000 / fila.precioConComision, 6)
    expect(fila.totalARecibir).toBeCloseTo(fila.vnARecibir * fila.aRecibir1Vn, 6)
    expect(fila.totalARecibir).toBeGreaterThan(fila.montoInvertir)
    expect(fila.plazoFijoMonto).not.toBeNull()
    expect(fila.vsPlazoFijo).not.toBeNull()
    expect(fila.vsPlazoFijoPorcentaje).not.toBeNull()
    expect(fila.vsPlazoFijoPorcentaje).toBeCloseTo(fila.vsPlazoFijo! / 10_000, 10)
    expect(fila.tem).toBeGreaterThan(0)
    expect(temDesdeGananciaDirecta(fila.gananciaDirecta, 8)).toBeCloseTo(fila.tem, 10)
  })

  it('VN a recibir coincide con acuantoesta (monto / precio c/ comisión)', () => {
    // S15S6: precio 1VN 1,0667 · comisión 0,2% → VN ≈ 935.555,65 sobre $1M
    const fila = calcularFilaLecap(
      { precioArs: 106.67, tnaMercado: 0.229, dias: 8 },
      {
        comisionPorcentaje: 0.2,
        tnaPlazoFijoPorcentaje: 0,
        montoInvertir: 1_000_000,
      },
    )

    expect(fila.precioConComision).toBeCloseTo(1.0667 * 1.002, 6)
    expect(fila.vnARecibir).toBeCloseTo(1_000_000 / fila.precioConComision, 4)
    expect(fila.vnARecibir).toBeCloseTo(935_599.37, 0)
    expect(fila.vnARecibir).not.toBeCloseTo(fila.totalARecibir, 0)
  })

  it('sincroniza cantidad → monto', () => {
    const fila = calcularFilaLecap(
      { precioArs: 106.68, tnaMercado: 0.229, dias: 8 },
      {
        comisionPorcentaje: 0.15,
        tnaPlazoFijoPorcentaje: 0,
        cantidadVn: 1000,
      },
    )

    expect(fila.montoInvertir).toBeCloseTo(fila.precioConComision * 1000, 4)
    expect(fila.vnARecibir).toBe(1000)
    expect(fila.plazoFijoMonto).toBeNull()
  })
})
