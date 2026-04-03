export interface ProcessedFund {
  fondo: string
  institution: string
  displayName: string
  tna: number
  tea: number
  fecha: string
  fechaAnterior?: string
  dias?: number
  patrimonio?: number
  logo?: string
  type?: string
  typeLabel?: string
  url?: string
  meta?: {
    showInFunds?: boolean
    showInAccounts?: boolean
    showInUsdFunds?: boolean
    showInStockFunds?: boolean
    showInUsdMoneyMarket?: boolean
  }
}

export interface PlazoFijo {
  entidad: string
  logo?: string
  tnaClientes: number
  tnaNoClientes: number | null
  enlace: string | null
  fecha?: string
  fechaAnterior?: string
  type: 'plazoFijo30d'
  typeLabel: string
}

/** Respuesta de `/v1/finanzas/tasas/plazoFijoUvaPagoPeriodico` (ArgentinaDatos). */
export interface TasaPlazoFijoUvaPagoPeriodico {
  nombre: string
  plazoMinDias: number
  plazoMaxDias: number
  tna: number
  tea: number
}

export interface ProveedorPlazoFijoUvaPagoPeriodico {
  id: string
  entidad: string
  logo: string
  tasas: TasaPlazoFijoUvaPagoPeriodico[]
}

export interface Lecap {
  symbol: string
  price: number
  bid: number
  ask: number
  type: 'LECAP' | 'BONCAP'
  finalPayment?: number
  maturity?: string
  days?: number
  tna?: number
  tir?: number
}

export interface UsdAccount {
  fondo: string
  tna: number
  tea: number
  tope: number | null
  fecha: string
}

export interface UsdAccountItem {
  logo: string
  institution: string
  type: string
  tna: number
  url: string
  badges: Array<{
    text: string
    variant: string
    icon: string
  }>
  isAccount: boolean
}
