/** Tasa usable en curvas de rendimiento (excluye negativas, cero y no finitas). */
export function isPositiveYieldRate(rate: number | null | undefined): boolean {
  return rate != null && Number.isFinite(rate) && rate > 0
}
