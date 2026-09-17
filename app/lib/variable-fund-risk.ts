/**
 * Criterio unificado de riesgo para fondos de "Rendimiento variable" (ARS)
 * en cuentas-billeteras, gráficos y contado-cuotas.
 *
 * - Riesgo muy bajo: Money Market (y fallback desconocido)
 * - Riesgo bajo: Renta fija (+ overrides Cocos Rendimiento / Pesos Plus)
 * - Riesgo moderado: Renta mixta / Retorno total
 */

export type VariableFundRiskLevel = 'muyBajo' | 'bajo' | 'moderado'

export const VARIABLE_FUND_RISK_ORDER: VariableFundRiskLevel[] = ['muyBajo', 'bajo', 'moderado']

export const VARIABLE_FUND_RISK_LABELS: Record<VariableFundRiskLevel, string> = {
  muyBajo: 'Riesgo muy bajo',
  bajo: 'Riesgo bajo',
  moderado: 'Riesgo moderado',
}

/** Keys de UI / selectores (kebab) alineadas al nivel de riesgo. */
export const VARIABLE_FUND_RISK_CATEGORY_KEYS: Record<
  VariableFundRiskLevel,
  `variable-${'muy-bajo' | 'bajo' | 'moderado'}`
> = {
  muyBajo: 'variable-muy-bajo',
  bajo: 'variable-bajo',
  moderado: 'variable-moderado',
}

/** Fondos cuyo tipo CAFCI no refleja el bucket de riesgo que usamos en la UI. */
const LOW_RISK_OVERRIDE_FUND_NAMES = new Set([
  'Cocos Rendimiento - Clase A',
  'Cocos Pesos Plus - Clase A',
])

export function getVariableFundRiskLevel(fund: {
  fondo?: string | null
  type?: string | null
}): VariableFundRiskLevel {
  if (fund.fondo && LOW_RISK_OVERRIDE_FUND_NAMES.has(fund.fondo)) {
    return 'bajo'
  }

  const type = fund.type || ''

  if (type === 'mercadoDinero') return 'muyBajo'
  if (type === 'rentaFija') return 'bajo'
  if (type === 'rentaMixta' || type === 'retornoTotal') return 'moderado'

  return 'muyBajo'
}

export function groupFundsByVariableRisk<T extends { fondo?: string | null; type?: string | null }>(
  funds: T[],
): Record<VariableFundRiskLevel, T[]> {
  const grouped: Record<VariableFundRiskLevel, T[]> = {
    muyBajo: [],
    bajo: [],
    moderado: [],
  }

  for (const fund of funds) {
    grouped[getVariableFundRiskLevel(fund)].push(fund)
  }

  return grouped
}
