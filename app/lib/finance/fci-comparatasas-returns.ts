export interface FciComparatasasRendimientos {
  ultimos7Dias: number | null
  unMes: number | null
}

export function getComparatasasReturnPercent(
  rendimientos: FciComparatasasRendimientos,
  tipoRenta: string,
) {
  if (tipoRenta === 'Mercado de Dinero') {
    return rendimientos.unMes ?? rendimientos.ultimos7Dias ?? 0
  }

  return rendimientos.unMes ?? 0
}

/** Convierte el rendimiento base (%) a TNA/TEA. No depende del tipo de renta. */
export function getComparatasasTnaAndTea(returnPercent: number) {
  const returnRate = returnPercent / 100
  const tna = returnRate
  const tea = Math.pow(1 + returnRate, 12) - 1

  return {
    tna: Number.isFinite(tna) ? tna : 0,
    tea: Number.isFinite(tea) ? tea : 0,
  }
}
