/** Cálculos de LECAP/BONCAP estilo comparador (precio 1VN, comisión, plazo fijo). */

export interface LecapMercadoInput {
  /** Precio de cotización por 100 VN (convención Docta / BYMA). */
  precioArs: number
  /** TNA de mercado en decimal (0,229 = 22,9%). */
  tnaMercado: number
  /** Días al vencimiento. */
  dias: number
  /** Variación diaria en % (0,18 = +0,18%), opcional. */
  variacionPorcentaje?: number
}

export interface LecapCalculoParams {
  /** Comisión broker en % (0,15 = 0,15%). */
  comisionPorcentaje: number
  /** TNA de plazo fijo de referencia en % (30 = 30%). */
  tnaPlazoFijoPorcentaje: number
  /** Monto a invertir en pesos (opcional). */
  montoInvertir?: number | null
  /** Cantidad de VN (opcional; si no hay monto, se usa esto). */
  cantidadVn?: number | null
}

export interface LecapCalculoResultado {
  precio1Vn: number
  aRecibir1Vn: number
  precioConComision: number
  gananciaDirecta: number
  tna: number
  tem: number
  montoInvertir: number
  /** Alias de `vnARecibir` (cantidad de VN comprada). */
  cantidadVn: number
  /** VN comprados con el monto: monto ÷ precio con comisión. */
  vnARecibir: number
  /** Pesos al vencimiento: vnARecibir × aRecibir1Vn. */
  totalARecibir: number
  plazoFijoMonto: number | null
  /** Diferencia en pesos: total LECAP − total plazo fijo. */
  vsPlazoFijo: number | null
  /** Diferencia relativa al monto invertido (decimal, p. ej. -0,0022 = -0,22%). */
  vsPlazoFijoPorcentaje: number | null
}

/** Precio por 1 valor nominal a partir del precio por 100 VN. */
export function precio1VnDesde100(precioArs: number): number {
  return precioArs / 100
}

/**
 * Residual / a recibir al vencimiento por 1 VN, implícito en precio + TNA mercado.
 * aRecibir = precio × (1 + TNA × días / 365)
 */
export function aRecibir1VnDesdeMercado(
  precio1Vn: number,
  tnaMercado: number,
  dias: number,
): number {
  if (!(precio1Vn > 0) || !(dias > 0) || !Number.isFinite(tnaMercado)) return precio1Vn
  return precio1Vn * (1 + tnaMercado * (dias / 365))
}

export function precioConComision1Vn(precio1Vn: number, comisionPorcentaje: number): number {
  const c = Number.isFinite(comisionPorcentaje) ? comisionPorcentaje : 0
  return precio1Vn * (1 + c / 100)
}

/** Ganancia directa decimal: (aRecibir − precioConComisión) / precioConComisión */
export function gananciaDirectaDecimal(aRecibir1Vn: number, precioConComision: number): number {
  if (!(precioConComision > 0)) return 0
  return aRecibir1Vn / precioConComision - 1
}

export function tnaDesdeGananciaDirecta(gananciaDirecta: number, dias: number): number {
  if (!(dias > 0)) return 0
  return gananciaDirecta * (365 / dias)
}

/** TEM implícita base 30 días a partir de la ganancia directa al vencimiento. */
export function temDesdeGananciaDirecta(gananciaDirecta: number, dias: number): number {
  if (!(dias > 0)) return 0
  return Math.pow(1 + gananciaDirecta, 30 / dias) - 1
}

export function calcularFilaLecap(
  mercado: LecapMercadoInput,
  params: LecapCalculoParams,
): LecapCalculoResultado {
  const precio1Vn = precio1VnDesde100(mercado.precioArs)
  const aRecibir1Vn = aRecibir1VnDesdeMercado(precio1Vn, mercado.tnaMercado, mercado.dias)
  const precioConComision = precioConComision1Vn(precio1Vn, params.comisionPorcentaje)
  const gananciaDirecta = gananciaDirectaDecimal(aRecibir1Vn, precioConComision)
  const tna = tnaDesdeGananciaDirecta(gananciaDirecta, mercado.dias)
  const tem = temDesdeGananciaDirecta(gananciaDirecta, mercado.dias)

  let montoInvertir = params.montoInvertir ?? null
  let cantidadVn = params.cantidadVn ?? null

  if (montoInvertir != null && montoInvertir > 0 && precioConComision > 0) {
    cantidadVn = montoInvertir / precioConComision
  } else if (cantidadVn != null && cantidadVn > 0 && precioConComision > 0) {
    montoInvertir = cantidadVn * precioConComision
  } else {
    montoInvertir = 0
    cantidadVn = 0
  }

  const totalARecibir = (cantidadVn ?? 0) * aRecibir1Vn
  /** Cantidad de VN comprada con el monto (no el total en pesos al vto.). */
  const vnARecibir = cantidadVn ?? 0

  const tnaPf =
    Number.isFinite(params.tnaPlazoFijoPorcentaje) && params.tnaPlazoFijoPorcentaje > 0
      ? params.tnaPlazoFijoPorcentaje / 100
      : null

  let plazoFijoMonto: number | null = null
  let vsPlazoFijo: number | null = null
  let vsPlazoFijoPorcentaje: number | null = null

  if (tnaPf != null && (montoInvertir ?? 0) > 0 && mercado.dias > 0) {
    plazoFijoMonto = (montoInvertir ?? 0) * (1 + tnaPf * (mercado.dias / 365))
    vsPlazoFijo = totalARecibir - plazoFijoMonto
    vsPlazoFijoPorcentaje = vsPlazoFijo / (montoInvertir ?? 1)
  }

  return {
    precio1Vn,
    aRecibir1Vn,
    precioConComision,
    gananciaDirecta,
    tna,
    tem,
    montoInvertir: montoInvertir ?? 0,
    cantidadVn: cantidadVn ?? 0,
    vnARecibir,
    totalARecibir,
    plazoFijoMonto,
    vsPlazoFijo,
    vsPlazoFijoPorcentaje,
  }
}
