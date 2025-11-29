export interface CryptoLogoMapping {
  symbols: string[]
  logo: string
  name: string
}

// Blacklisted cryptocurrencies that should not be shown
const BLACKLISTED_SYMBOLS = ['ARS', 'USD', 'RDOC', 'NUPEN', 'NUCOP', 'NARS', 'NUARS']

export const cryptoLogoMappings: CryptoLogoMapping[] = [
  {
    symbols: ['USDC', 'usdc'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/usdc.png',
    name: 'USD Coin',
  },
  {
    symbols: ['USDT', 'usdt'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/usdt.png',
    name: 'Tether',
  },
  {
    symbols: ['DOT', 'dot'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/dot.png',
    name: 'Polkadot',
  },
  {
    symbols: ['DAI', 'dai'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/dai.png',
    name: 'DAI',
  },
  {
    symbols: ['BTC', 'btc'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/btc.png',
    name: 'Bitcoin',
  },
  {
    symbols: ['SOL', 'sol'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/sol.png',
    name: 'Solana',
  },
  {
    symbols: ['USDL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/usdl.webp',
    name: 'Lift Dollar',
  },
  {
    symbols: ['TRX', 'TRON', 'tron'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/trx.png',
    name: 'Tron',
  },
  {
    symbols: ['BNB'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/bnb.png',
    name: 'BNB',
  },
  {
    symbols: ['AVAX'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/avax.png',
    name: 'Avalanche',
  },
  {
    symbols: ['ETH'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/eth.png',
    name: 'Ethereum',
  },
  {
    symbols: ['POL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/pol.png',
    name: 'POL',
  },
  {
    symbols: ['ADA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/ada.png',
    name: 'Cardano',
  },
  {
    symbols: ['USDP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/usdp.png',
    name: 'Pax Dollar',
  },
  {
    symbols: ['UXD'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/uxd.png',
    name: 'Criptodólar',
  },
  {
    symbols: ['RBTC'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/rbtc.png',
    name: 'Rootstock BTC',
  },
  {
    symbols: ['USDD'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/usdd.png',
    name: 'Decentralized USD',
  },
]

export function getCryptoLogo(symbol: string): string {
  const defaultLogo = 'https://api.argentinadatos.com/static/comparatasas/logos/crypto/default.png'
  if (!symbol) return defaultLogo

  const normalizedSymbol = symbol.toLowerCase().trim()

  const mapping = cryptoLogoMappings.find((m) =>
    m.symbols.some((s) => normalizedSymbol === s.toLowerCase()),
  )

  return mapping?.logo || defaultLogo
}

export function getCryptoName(symbol: string): string {
  if (!symbol) return ''

  const normalizedSymbol = symbol.toLowerCase().trim()

  const mapping = cryptoLogoMappings.find((m) =>
    m.symbols.some((s) => normalizedSymbol === s.toLowerCase()),
  )

  return mapping?.name || symbol
}

export function shouldShowCrypto(symbol: string): boolean {
  if (!symbol) return false

  const normalizedSymbol = symbol.toLowerCase().trim()
  return !BLACKLISTED_SYMBOLS.some((blacklisted) => normalizedSymbol === blacklisted.toLowerCase())
}

// Calcula el máximo APY para una criptomoneda entre todos los proveedores
// Toma el máximo por proveedor (puede haber múltiples opciones/protocolos) y luego el máximo global
export function getCryptoMaxYield(
  crypto: string,
  cryptoEntities: { entidad: string; rendimientos: { moneda: string; apy: number }[] }[],
): number {
  const maxYieldsPerEntity = cryptoEntities
    .map((entity) => {
      const yieldsForCrypto = entity.rendimientos
        .filter((r) => r.moneda === crypto)
        .map((r) => r.apy)

      return yieldsForCrypto.length > 0 ? Math.max(...yieldsForCrypto) : 0
    })
    .filter((maxYield) => maxYield > 0)

  return maxYieldsPerEntity.length > 0 ? Math.max(...maxYieldsPerEntity) : 0
}
