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

  const calculateResults = <
    T extends {
      tna: number
      tope?: number | null
      type?: string
      fondo?: string
      plazoMinDias?: number
      plazoMaxDias?: number
    },
  >(
    itemsRef: Ref<T[]> | ComputedRef<T[]>,
    allFundsCache?: Ref<any[]>,
  ) => {
    return computed(() => {
      const funds = allFundsCache?.value || []
      const deltaPesosFund = funds.find(
        (f: any) => f.fondo === 'Delta Pesos - Clase A' && f.institution === 'Fiwind',
      )

      return unref(itemsRef).map((item) => {
        const hasLimit = item.tope !== null && item.tope !== undefined
        const exceedsLimit = hasLimit && amount.value > item.tope!
        const isFiwind = item.fondo === 'Fiwind' && hasLimit && exceedsLimit && deltaPesosFund

        const isPlazoFijo = item.type === 'plazoFijo30d'
        const isUvaPagoPeriodico = item.type === 'plazoFijoUvaPagoPeriodico'
        const effectiveDays = isPlazoFijo ? 30 : days.value

        const uvaPlazoMin = item.plazoMinDias
        const uvaPlazoMax = item.plazoMaxDias
        const simulationDisabled =
          isUvaPagoPeriodico &&
          uvaPlazoMin !== undefined &&
          uvaPlazoMax !== undefined &&
          (days.value < uvaPlazoMin || days.value > uvaPlazoMax)

        let result: { finalAmount: number; earned: number }
        let effectiveAmount = amount.value

        if (simulationDisabled) {
          return {
            ...item,
            simulationDisabled: true as const,
          }
        }

        if (isFiwind) {
          const topeAmount = item.tope!
          const excedenteAmount = amount.value - topeAmount
          const tnaValue = item.tna

          const topeResult = calculateCompoundInterest(topeAmount, tnaValue, effectiveDays)
          const excedenteResult = calculateCompoundInterest(
            excedenteAmount,
            deltaPesosFund.tna,
            effectiveDays,
          )

          result = {
            finalAmount: topeResult.finalAmount + excedenteResult.finalAmount,
            earned: topeResult.earned + excedenteResult.earned,
          }
        } else {
          effectiveAmount = exceedsLimit ? item.tope! : amount.value
          const tnaValue = isPlazoFijo || isUvaPagoPeriodico ? item.tna / 100 : item.tna

          result = isPlazoFijo
            ? calculateSimpleInterest(effectiveAmount, tnaValue, effectiveDays)
            : calculateCompoundInterest(effectiveAmount, tnaValue, effectiveDays)
        }

        return {
          ...item,
          simulationDisabled: false as const,
          simulation: {
            initialAmount: amount.value,
            effectiveAmount: isFiwind ? amount.value : effectiveAmount,
            finalAmount: result.finalAmount,
            earned: result.earned,
            days: effectiveDays,
            exceedsLimit: isFiwind ? false : exceedsLimit,
            limit: item.tope,
            isPlazoFijo,
            isFiwind,
            deltaPesosTna: isFiwind ? deltaPesosFund.tna : undefined,
          },
        }
      })
    })
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
