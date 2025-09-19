export interface ProcessedFund {
  fondo: string
  institution: string
  displayName: string
  tna: number
  tea: number
  fecha: string
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
  type: 'plazoFijo30d'
  typeLabel: string
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
