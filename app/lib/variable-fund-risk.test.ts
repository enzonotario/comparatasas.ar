import { describe, expect, it } from 'vitest'
import {
  getVariableFundRiskLevel,
  groupFundsByVariableRisk,
  VARIABLE_FUND_RISK_LABELS,
} from './variable-fund-risk'

describe('getVariableFundRiskLevel', () => {
  it('clasifica money market como riesgo muy bajo', () => {
    expect(getVariableFundRiskLevel({ type: 'mercadoDinero' })).toBe('muyBajo')
  })

  it('clasifica renta fija como riesgo bajo', () => {
    expect(getVariableFundRiskLevel({ type: 'rentaFija' })).toBe('bajo')
  })

  it('clasifica renta mixta y retorno total como riesgo moderado', () => {
    expect(getVariableFundRiskLevel({ type: 'rentaMixta' })).toBe('moderado')
    expect(getVariableFundRiskLevel({ type: 'retornoTotal' })).toBe('moderado')
  })

  it('fuerza Cocos Rendimiento y Pesos Plus a riesgo bajo', () => {
    expect(
      getVariableFundRiskLevel({
        fondo: 'Cocos Rendimiento - Clase A',
        type: 'mercadoDinero',
      }),
    ).toBe('bajo')
    expect(
      getVariableFundRiskLevel({
        fondo: 'Cocos Pesos Plus - Clase A',
        type: 'mercadoDinero',
      }),
    ).toBe('bajo')
  })

  it('usa riesgo muy bajo como fallback', () => {
    expect(getVariableFundRiskLevel({ type: '' })).toBe('muyBajo')
    expect(getVariableFundRiskLevel({})).toBe('muyBajo')
  })
})

describe('groupFundsByVariableRisk', () => {
  it('agrupa por nivel de riesgo con las etiquetas del index', () => {
    const grouped = groupFundsByVariableRisk([
      { fondo: 'MM', type: 'mercadoDinero' },
      { fondo: 'RF', type: 'rentaFija' },
      { fondo: 'RM', type: 'rentaMixta' },
      { fondo: 'Cocos Rendimiento - Clase A', type: 'mercadoDinero' },
    ])

    expect(grouped.muyBajo.map((f) => f.fondo)).toEqual(['MM'])
    expect(grouped.bajo.map((f) => f.fondo)).toEqual(['RF', 'Cocos Rendimiento - Clase A'])
    expect(grouped.moderado.map((f) => f.fondo)).toEqual(['RM'])
    expect(VARIABLE_FUND_RISK_LABELS.bajo).toBe('Riesgo bajo')
  })
})
