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

export function getComparatasasTnaAndTea(returnPercent: number, tipoRenta: string) {
  const returnRate = returnPercent / 100
  const tna = tipoRenta === 'Mercado de Dinero' ? returnRate : returnRate * (365 / 30)
  const tea = Math.pow(1 + returnPercent / 100, 12) - 1

  return {
    tna: Number.isFinite(tna) ? tna : 0,
    tea: Number.isFinite(tea) ? tea : 0,
  }
}
