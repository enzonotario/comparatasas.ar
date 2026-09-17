/**
 * Tope de monto remunerado declarado por la entidad.
 * `null` / `undefined` / `≤ 0` = sin tope (la API a veces manda 0 cuando no hay límite).
 */
export function hasDeclaredTope(tope: number | null | undefined): tope is number {
  return tope != null && Number.isFinite(tope) && tope > 0
}

/** Normaliza tope de API: 0 o inválido → `null` (sin límite). */
export function normalizeTope(tope: number | null | undefined): number | null {
  return hasDeclaredTope(tope) ? tope : null
}
