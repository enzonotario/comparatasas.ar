/** Alícuota IVA general (21%) aplicada sobre aranceles que publican “+ IVA”. */
export const IVA_COMISION_COBRO = 0.21

export interface ComisionCobroSimInput {
  /** Monto de la venta en pesos. */
  monto: number
  /** Arancel en decimal (p. ej. 0.008 = 0,80%). */
  arancel: number | null
  /** Si el arancel publicado suma IVA. */
  ivaAdicional: boolean
  /** Si el usuario quiere sumar IVA cuando aplique. */
  sumarIva: boolean
}

export interface ComisionCobroSimResult {
  arancelBase: number
  iva: number
  costo: number
  neto: number
  costoEfectivoRate: number
}

/**
 * Estima costo de cobro y neto a acreditar sobre un monto de venta.
 * Si `arancel` es null, no se puede simular.
 */
export function simulateComisionCobro(
  input: ComisionCobroSimInput,
): ComisionCobroSimResult | null {
  const { monto, arancel, ivaAdicional, sumarIva } = input
  if (arancel == null || !Number.isFinite(arancel) || !Number.isFinite(monto) || monto <= 0) {
    return null
  }

  const arancelBase = monto * arancel
  const iva = ivaAdicional && sumarIva ? arancelBase * IVA_COMISION_COBRO : 0
  const costo = arancelBase + iva
  const neto = monto - costo

  return {
    arancelBase,
    iva,
    costo,
    neto,
    costoEfectivoRate: costo / monto,
  }
}
