export interface FciComparatasasRendimientos {
  ultimos7Dias: number | null
  unMes: number | null
  /** Variación diaria CNV en %; se usa para estimar TNA de money market. */
  variacionDiariaPct?: number | null
}

export function getComparatasasReturnPercent(
  rendimientos: FciComparatasasRendimientos,
  tipoRenta: string,
) {
  if (tipoRenta === 'Mercado de Dinero') {
    // CNV publica retornos de período; para MM la TNA ≈ variación diaria * 365.
    if (
      rendimientos.variacionDiariaPct != null &&
      Number.isFinite(rendimientos.variacionDiariaPct)
    ) {
      return rendimientos.variacionDiariaPct * 365
    }

    // Legacy CAFCI: unMes/ultimos7Dias ya venían anualizados ~TNA.
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
