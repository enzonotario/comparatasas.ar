export type PlanInputMode = 'installment' | 'total'

export interface ProductScenario {
  id: string
  order?: number
  name: string
  merchant?: string
  imageUrl?: string
  affiliateUrl: string
  priceLabel?: string
  installmentLabel?: string
  cashPrice: number
  installmentCount: number
  inputMode: PlanInputMode
  installmentAmount?: number
  financedTotal?: number
}
