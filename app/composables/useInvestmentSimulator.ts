export function useInvestmentSimulator() {
  const amount = useState('simulator-amount', () => 100000)
  const days = useState('simulator-days', () => 30)
  const isOpen = useState('simulator-isOpen', () => false)
  const isSimulating = useState('simulator-isSimulating', () => false)

  const calculateCompoundInterest = (
    principal: number,
    annualRate: number,
    daysInvested: number,
  ): { finalAmount: number; earned: number } => {
    const dailyRate = annualRate / 365
    const finalAmount = principal * Math.pow(1 + dailyRate, daysInvested)
    const earned = finalAmount - principal

    return {
      finalAmount,
      earned,
    }
  }

  const calculateSimpleInterest = (
    principal: number,
    annualRate: number,
    daysInvested: number,
  ): { finalAmount: number; earned: number } => {
    const earned = principal * annualRate * (daysInvested / 365)
    const finalAmount = principal + earned

    return {
      finalAmount,
      earned,
    }
  }

  const calculateResults = <T extends { tna: number; tope?: number | null; type?: string }>(
    itemsRef: Ref<T[]> | ComputedRef<T[]>,
  ) => {
    return computed(() =>
      unref(itemsRef).map((item) => {
        const hasLimit = item.tope !== null && item.tope !== undefined
        const exceedsLimit = hasLimit && amount.value > item.tope!

        // Plazos fijos usan 30 días fijos e interés simple
        const isPlazoFijo = item.type === 'plazoFijo30d'
        const effectiveDays = isPlazoFijo ? 30 : days.value

        // Si excede el límite, calculamos solo hasta el tope
        const effectiveAmount = exceedsLimit ? item.tope! : amount.value

        // Normalizar TNA: plazos fijos vienen en porcentaje (40), cuentas en decimal (0.40)
        const tnaValue = isPlazoFijo ? item.tna / 100 : item.tna

        // Plazos fijos usan interés simple, el resto usa interés compuesto
        const result = isPlazoFijo
          ? calculateSimpleInterest(effectiveAmount, tnaValue, effectiveDays)
          : calculateCompoundInterest(effectiveAmount, tnaValue, effectiveDays)

        return {
          ...item,
          simulation: {
            initialAmount: amount.value,
            effectiveAmount,
            finalAmount: result.finalAmount,
            earned: result.earned,
            days: effectiveDays,
            exceedsLimit,
            limit: item.tope,
            isPlazoFijo,
          },
        }
      }),
    )
  }

  return {
    amount,
    days,
    isOpen,
    isSimulating,
    calculateCompoundInterest,
    calculateResults,
  }
}
