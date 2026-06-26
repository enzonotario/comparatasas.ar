export interface FundInstitution {
  institution: string
  displayName: string
  url?: string
  logo?: string
  showInFunds: boolean
  showInAccounts: boolean
  showInUsdFunds: boolean
  showInStockFunds: boolean
  showInUsdMoneyMarket: boolean
  showInUsdHighRisk?: boolean
  fundUrl?: string
}

export interface FundMapping {
  fundName: string
  institutions: FundInstitution[]
}

export type FundType =
  | 'rentaFija'
  | 'mercadoDinero'
  | 'rentaMixta'
  | 'rentaVariable'
  | 'retornoTotal'

export interface FundTypeInfo {
  type: FundType
  typeLabel: string
}

function slugifyFundName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeFundType(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function getFundTypeInfo(
  tipoRenta?: string | null,
  fallback?: FundType,
): FundTypeInfo | undefined {
  const normalized = normalizeFundType(tipoRenta || '')

  if (
    normalized === 'mercado de dinero' ||
    normalized === 'money market' ||
    normalized === 'moneymarket'
  ) {
    return { type: 'mercadoDinero', typeLabel: 'Money Market' }
  }

  if (normalized === 'renta fija' || normalized === 'rentafija') {
    return { type: 'rentaFija', typeLabel: 'Renta Fija' }
  }

  if (normalized === 'renta mixta' || normalized === 'rentamixta') {
    return { type: 'rentaMixta', typeLabel: 'Renta Mixta' }
  }

  if (normalized === 'renta variable' || normalized === 'rentavariable') {
    return { type: 'rentaVariable', typeLabel: 'Renta Variable' }
  }

  if (normalized === 'retorno total' || normalized === 'retornototal') {
    return { type: 'retornoTotal', typeLabel: 'Retorno Total' }
  }

  if (!fallback) return undefined

  const fallbackLabels: Record<FundType, string> = {
    rentaFija: 'Renta Fija',
    mercadoDinero: 'Money Market',
    rentaMixta: 'Renta Mixta',
    rentaVariable: 'Renta Variable',
    retornoTotal: 'Retorno Total',
  }

  return {
    type: fallback,
    typeLabel: fallbackLabels[fallback],
  }
}

const fundMappings: FundMapping[] = [
  {
    fundName: 'Mercado Fondo - Clase A',
    institutions: [
      {
        institution: 'Mercado Pago',
        displayName: 'Mercado Pago',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'MP Ahorro - Clase A',
    institutions: [
      {
        institution: 'Mercado Pago',
        displayName: 'Mercado Pago / Bonos, plazos fijos y más',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Delta Pesos - Clase X',
    institutions: [
      {
        institution: 'Personal Pay',
        displayName: 'Personal Pay',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Fima Premium - Clase A',
    institutions: [
      {
        institution: 'Banco Galicia',
        displayName: 'Galicia',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Super Ahorro $ - Clase A',
    institutions: [
      {
        institution: 'Banco Santander',
        displayName: 'Santander',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Vinci Compass Liquidez - Clase F',
    institutions: [
      {
        institution: 'Lemon',
        displayName: 'Lemon',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Cocos Ahorro - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos Ahorro',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Cocos Rendimiento - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos Rendimiento FCI',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Cocos Pesos Plus - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos Pesos Plus',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IOL Cash Management - Clase A',
    institutions: [
      {
        institution: 'IOL',
        displayName: 'IOL Cash Management',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
        fundUrl: 'https://www.invertironline.com/productos/iol-cash-management?ref=comparatasas',
      },
    ],
  },
  {
    fundName: 'Cocos Ahorro Dólares - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Cocos Dólares Plus - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Allaria Ahorro - Clase E',
    institutions: [
      {
        institution: 'Prex',
        displayName: 'Prex',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'ST Zero - Clase D',
    institutions: [
      {
        institution: 'letsbit',
        displayName: 'LB Finanzas',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
      {
        institution: 'Astropay',
        displayName: 'AstroPay',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Premier Renta CP en Pesos - Clase A',
    institutions: [
      {
        institution: 'Supervielle',
        displayName: 'Supervielle',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Adcap Ahorro Pesos Fondo de Dinero - Clase A',
    institutions: [
      {
        institution: 'Adcap',
        displayName: 'Adcap',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Balanz Capital Money Market - Clase A',
    institutions: [
      {
        institution: 'Balanz',
        displayName: 'Balanz',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Balanz Ahorro en Dólares - Clase A',
    institutions: [
      {
        institution: 'Balanz',
        displayName: 'Balanz',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IEB Ahorro - Clase A',
    institutions: [
      {
        institution: 'ieb',
        displayName: 'IEB+',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Pionero Pesos - Clase A',
    institutions: [
      {
        institution: 'macro',
        displayName: 'Macro',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Alpha Pesos - Clase A',
    institutions: [
      {
        institution: 'icbc',
        displayName: 'ICBC',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Ualintec Ahorro Pesos - Clase A',
    institutions: [
      {
        institution: 'uala',
        displayName: 'Ualá',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Ualintec Pesos Plus - Clase A',
    institutions: [
      {
        institution: 'UALA',
        displayName: 'Ualá',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IOL Dólar Ahorro Plus - Clase D',
    institutions: [
      {
        institution: 'iol',
        displayName: 'IOL',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Fima Renta Fija Dólares - Clase A',
    institutions: [
      {
        institution: 'Banco Galicia',
        displayName: 'Galicia',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IEB Estratégico - Clase A',
    institutions: [
      {
        institution: 'ieb',
        displayName: 'IEB',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IEB Estratégico II - Clase A',
    institutions: [
      {
        institution: 'ieb',
        displayName: 'IEB+ Ciclo Nova',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
        showInUsdHighRisk: true,
        fundUrl: 'https://fondociclonova.com.ar/?ref=comparatasas',
      },
    ],
  },
  {
    fundName: 'Ualintec Renta Dólares - Clase A',
    institutions: [
      {
        institution: 'UALA',
        displayName: 'Uala',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'SBS Acciones Argentina - Clase A',
    institutions: [
      {
        institution: 'SBS',
        displayName: 'SBS',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'SBS Ahorro Pesos - Clase A',
    institutions: [
      {
        institution: 'CLARO PAY',
        displayName: 'Claro Pay',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
      {
        institution: 'CENCOPAY',
        displayName: 'CencoPay',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Balanz Acciones - Clase A',
    institutions: [
      {
        institution: 'Balanz',
        displayName: 'Balanz',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IEB Value - Clase A',
    institutions: [
      {
        institution: 'ieb',
        displayName: 'IEB',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Ualintec Renta Variable Pesos - Clase A',
    institutions: [
      {
        institution: 'UALA',
        displayName: 'Ualintec',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'IAM Retorno Dólares - Clase A',
    institutions: [
      {
        institution: 'Mercado Pago',
        displayName: 'Mercado Pago',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'IEB Corto Plazo Dólar - Clase A',
    institutions: [
      {
        institution: 'ieb',
        displayName: 'Ieb+',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Balanz Money Market USD - Clase A',
    institutions: [
      {
        institution: 'balanz',
        displayName: 'Balanz',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'SBS Liquidez USD - Clase A',
    institutions: [
      {
        institution: 'SBS',
        displayName: 'SBS',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Pionero Money Market Dólar - Clase A',
    institutions: [
      {
        institution: 'macro',
        displayName: 'Macro',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Pionero Acciones',
    institutions: [
      {
        institution: 'macro',
        displayName: 'Macro',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Adcap Ahorro Dólares - Clase C',
    institutions: [
      {
        institution: 'Adcap',
        displayName: 'Adcap',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Superfondo Ahorro en Dólares - Clase A',
    institutions: [
      {
        institution: 'Santander',
        displayName: 'Santander',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Allaria Dólar Ahorro - Clase A',
    institutions: [
      {
        institution: 'Allaria',
        displayName: 'Allaria',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Pionero Money Market Dólar - Clase A',
    institutions: [
      {
        institution: 'Macro',
        displayName: 'Macro',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Fima Premium Dólares - Clase A',
    institutions: [
      {
        institution: 'Galicia',
        displayName: 'Galicia',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Gainvest Renta Fija Dolares - Clase A',
    institutions: [
      {
        institution: 'stonex',
        displayName: 'StoneX',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Crecer Renta Dólar - Clase A',
    institutions: [
      {
        institution: 'banco ciudad',
        displayName: 'Banco Ciudad',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Crecer Acciones - Clase A',
    institutions: [
      {
        institution: 'banco ciudad',
        displayName: 'Banco Ciudad',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Cocos Acciones - Clase A',
    institutions: [
      {
        institution: 'cocos',
        displayName: 'Cocos Acciones',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Toronto Trust Multimercado - Clase A',
    institutions: [
      {
        institution: 'toronto',
        displayName: 'Toronto Multimercado',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: true,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Toronto Trust Ahorro - Clase A',
    institutions: [
      {
        institution: 'toronto',
        displayName: 'Toronto Ahorro',
        showInAccounts: false,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Toronto Trust Money Market Dólar - Clase A',
    institutions: [
      {
        institution: 'toronto',
        displayName: 'Toronto MM USD',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: true,
      },
    ],
  },
  {
    fundName: 'Toronto Trust Renta Dólar - Clase A',
    institutions: [
      {
        institution: 'toronto',
        displayName: 'Toronto MM USD',
        showInAccounts: false,
        showInFunds: false,
        showInUsdFunds: true,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
  {
    fundName: 'Delta Pesos - Clase A',
    institutions: [
      {
        institution: 'Fiwind',
        displayName: 'Fiwind',
        showInAccounts: true,
        showInFunds: true,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
    ],
  },
]

export function getFundMapping(fundName: string): FundMapping | undefined {
  return fundMappings.find((m) => m.fundName === fundName)
}

export function getFundMappingBySlug(fundSlug: string): FundMapping | undefined {
  return fundMappings.find((m) => slugifyFundName(m.fundName) === fundSlug)
}

export function getAllMappedFundNames(): string[] {
  return fundMappings.map((m) => m.fundName)
}

export const comparatasasFondosArs = [
  'adcap-ahorro-pesos-fondo-de-dinero-clase-a',
  'allaria-ahorro-clase-e',
  'alpha-pesos-clase-a',
  'balanz-acciones-clase-a',
  'balanz-capital-money-market-clase-a',
  'cocos-acciones-clase-a',
  'cocos-ahorro-clase-a',
  'cocos-pesos-plus-clase-a',
  'cocos-rendimiento-clase-a',
  'crecer-acciones-clase-a',
  'delta-pesos-clase-a',
  'delta-pesos-clase-x',
  'fima-premium-clase-a',
  'vinci-compass-liquidez-clase-f',
  'ieb-ahorro-clase-a',
  'ieb-value-clase-a',
  'iol-cash-management-clase-a',
  'mercado-fondo-clase-a',
  'mp-ahorro-clase-a',
  'pionero-acciones',
  'pionero-pesos-clase-a',
  'premier-renta-cp-en-pesos-clase-a',
  'sbs-acciones-argentina-clase-a',
  'sbs-ahorro-pesos-clase-a',
  'st-zero-clase-d',
  'toronto-trust-ahorro-clase-a',
  'toronto-trust-multimercado-clase-a',
  'ualintec-ahorro-pesos-clase-a',
  'ualintec-pesos-plus-clase-a',
  'ualintec-renta-variable-pesos-clase-a',
]

export const comparatasasFondosUsd = [
  'adcap-ahorro-dolares-clase-c',
  'allaria-dolar-ahorro-clase-a',
  'balanz-ahorro-en-dolares-clase-a',
  'balanz-money-market-usd-clase-a',
  'cocos-ahorro-dolares-clase-a',
  'cocos-dolares-plus-clase-a',
  'crecer-renta-dolar-clase-a',
  'fima-premium-dolares-clase-a',
  'fima-renta-fija-dolares-clase-a',
  'gainvest-renta-fija-dolares-clase-a',
  'iam-retorno-dolares-clase-a',
  'ieb-corto-plazo-dolar-clase-a',
  'ieb-estrategico-clase-a',
  'ieb-estrategico-ii-clase-a',
  'iol-dolar-ahorro-plus-clase-d',
  'pionero-money-market-dolar-clase-a',
  'sbs-liquidez-usd-clase-a',
  'superfondo-ahorro-en-dolares-clase-a',
  'toronto-trust-money-market-dolar-clase-a',
  'toronto-trust-renta-dolar-clase-a',
  'ualintec-renta-dolares-clase-a',
]

export const comparatasasFondos = [...comparatasasFondosArs, ...comparatasasFondosUsd]
