export interface InvestmentCarryOption {
  id: string
  label: string
  tna: number
  tope: number | null
  typeLabel?: string
  logo?: string
}

export interface InvestmentCarryAllocation {
  id: string
  label: string
  tna: number
  tope: number | null
  initialAmount: number
  typeLabel?: string
  logo?: string
  isCashReserve?: boolean
}

export interface InvestmentCarryPointBucket {
  id: string
  label: string
  tna: number
  balance: number
  interestEarned: number
  isCashReserve?: boolean
}

export interface InvestmentCarryPoint {
  period: number
  label: string
  payment: number
  cumulativePaid: number
  interestEarned: number
  cumulativeInterestEarned: number
  portfolioBalanceBeforePayment: number
  portfolioBalanceAfterPayment: number
  remainingLiability: number
  cumulativeShortfall: number
  netOutcome: number
  buckets: InvestmentCarryPointBucket[]
}

export interface SimulateInvestmentCarryOptions {
  initialCash: number
  installmentAmount: number
  installmentCount: number
  selectedOptions: ReadonlyArray<InvestmentCarryOption>
  daysPerInstallment?: number
}

export interface InvestmentCarrySimulationResult {
  allocations: InvestmentCarryAllocation[]
  points: InvestmentCarryPoint[]
  finalBalance: number
  cumulativeShortfall: number
  totalInterestEarned: number
  netOutcome: number
}

export function growthFactorForNominalAnnualRate(annualRate: number, days: number): number {
  if (!Number.isFinite(annualRate) || !Number.isFinite(days) || days <= 0) return 1
  return Math.pow(1 + annualRate / 365, days)
}

export function allocateInitialCashAcrossOptions(
  initialCash: number,
  selectedOptions: ReadonlyArray<InvestmentCarryOption>,
): InvestmentCarryAllocation[] {
  if (!Number.isFinite(initialCash) || initialCash <= 0) return []

  const sorted = [...selectedOptions].sort((a, b) => {
    if (b.tna !== a.tna) return b.tna - a.tna
    return a.label.localeCompare(b.label)
  })

  let remaining = initialCash
  const allocations: InvestmentCarryAllocation[] = []

  for (const option of sorted) {
    if (remaining <= 0) break

    const cap = option.tope == null ? Infinity : Math.max(0, option.tope)
    const initialAmount = Math.min(remaining, cap)
    if (initialAmount <= 0) continue

    allocations.push({
      id: option.id,
      label: option.label,
      tna: option.tna,
      tope: option.tope,
      initialAmount,
      typeLabel: option.typeLabel,
      logo: option.logo,
    })

    remaining -= initialAmount
  }

  if (remaining > 0) {
    allocations.push({
      id: 'cash-reserve',
      label: 'Saldo sin invertir',
      tna: 0,
      tope: null,
      initialAmount: remaining,
      typeLabel: 'Liquidez',
      isCashReserve: true,
    })
  }

  return allocations
}

export function simulateInvestmentCarry(
  options: SimulateInvestmentCarryOptions,
): InvestmentCarrySimulationResult {
  const {
    initialCash,
    installmentAmount,
    installmentCount,
    selectedOptions,
    daysPerInstallment = 30,
  } = options

  if (
    !Number.isFinite(initialCash) ||
    initialCash <= 0 ||
    !Number.isFinite(installmentAmount) ||
    installmentAmount <= 0 ||
    !Number.isFinite(installmentCount) ||
    installmentCount < 1 ||
    selectedOptions.length === 0
  ) {
    return {
      allocations: [],
      points: [],
      finalBalance: 0,
      cumulativeShortfall: 0,
      totalInterestEarned: 0,
      netOutcome: 0,
    }
  }

  const allocations = allocateInitialCashAcrossOptions(initialCash, selectedOptions)
  const state = allocations.map((allocation) => ({
    ...allocation,
    balance: allocation.initialAmount,
  }))

  let cumulativePaid = 0
  let cumulativeShortfall = 0
  let cumulativeInterestEarned = 0

  const totalFinanced = installmentAmount * installmentCount

  const points: InvestmentCarryPoint[] = [
    {
      period: 0,
      label: 'Hoy',
      payment: 0,
      cumulativePaid: 0,
      interestEarned: 0,
      cumulativeInterestEarned: 0,
      portfolioBalanceBeforePayment: initialCash,
      portfolioBalanceAfterPayment: initialCash,
      remainingLiability: totalFinanced,
      cumulativeShortfall: 0,
      netOutcome: initialCash - totalFinanced,
      buckets: state.map((bucket) => ({
        id: bucket.id,
        label: bucket.label,
        tna: bucket.tna,
        balance: bucket.balance,
        interestEarned: 0,
        isCashReserve: bucket.isCashReserve,
      })),
    },
  ]

  for (let period = 1; period <= installmentCount; period++) {
    let interestEarned = 0

    for (const bucket of state) {
      const previousBalance = bucket.balance
      const nextBalance =
        previousBalance * growthFactorForNominalAnnualRate(bucket.tna, daysPerInstallment)
      bucket.balance = nextBalance
      interestEarned += nextBalance - previousBalance
    }

    cumulativeInterestEarned += interestEarned

    const portfolioBalanceBeforePayment = state.reduce((acc, bucket) => acc + bucket.balance, 0)

    let remainingPayment = installmentAmount
    const withdrawOrder = [...state].sort((a, b) => {
      if (a.tna !== b.tna) return a.tna - b.tna
      return b.balance - a.balance
    })

    for (const bucket of withdrawOrder) {
      if (remainingPayment <= 0) break
      const extracted = Math.min(bucket.balance, remainingPayment)
      bucket.balance -= extracted
      remainingPayment -= extracted
    }

    cumulativePaid += installmentAmount
    cumulativeShortfall += remainingPayment

    const portfolioBalanceAfterPayment = state.reduce((acc, bucket) => acc + bucket.balance, 0)
    const remainingLiability = installmentAmount * (installmentCount - period)
    const netOutcome = portfolioBalanceAfterPayment - cumulativeShortfall - remainingLiability

    points.push({
      period,
      label: `Mes ${period}`,
      payment: installmentAmount,
      cumulativePaid,
      interestEarned,
      cumulativeInterestEarned,
      portfolioBalanceBeforePayment,
      portfolioBalanceAfterPayment,
      remainingLiability,
      cumulativeShortfall,
      netOutcome,
      buckets: state.map((bucket) => ({
        id: bucket.id,
        label: bucket.label,
        tna: bucket.tna,
        balance: bucket.balance,
        interestEarned: bucket.balance * 0,
        isCashReserve: bucket.isCashReserve,
      })),
    })
  }

  const finalPoint = points[points.length - 1]

  return {
    allocations,
    points,
    finalBalance: finalPoint?.portfolioBalanceAfterPayment ?? 0,
    cumulativeShortfall: finalPoint?.cumulativeShortfall ?? 0,
    totalInterestEarned: cumulativeInterestEarned,
    netOutcome: finalPoint?.netOutcome ?? 0,
  }
}
