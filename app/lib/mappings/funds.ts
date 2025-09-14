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
}

export interface FundMapping {
  fundName: string
  institutions: FundInstitution[]
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
    fundName: 'Fima Premium - Clase P',
    institutions: [
      {
        institution: 'Lemon',
        displayName: 'Lemon',
        showInAccounts: true,
        showInFunds: false,
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
    fundName: 'Cocos Daruma Renta Mixta - Clase A',
    institutions: [
      {
        institution: 'Cocos',
        displayName: 'Cocos Daruma',
        showInAccounts: true,
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
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
        showInFunds: false,
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
        showInFunds: false,
        showInUsdFunds: false,
        showInStockFunds: false,
        showInUsdMoneyMarket: false,
      },
      {
        institution: 'Astropay',
        displayName: 'Astropay',
        showInAccounts: true,
        showInFunds: false,
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
        displayName: 'UALA',
        showInAccounts: false,
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
]

export function getFundMapping(fundName: string): FundMapping | undefined {
  return fundMappings.find((m) => m.fundName === fundName)
}
