export interface InstitutionInfo {
  logo: string
  url?: string
}

export const institutions: Array<{
  names: string[]
  logo: string
  shortName: string
  url: string
}> = [
  {
    names: [
      'bna',
      'banco nacion',
      'Banco de la Nación Argentina',
      'banco de la nacion argentina',
      'BANCO DE LA NACION ARGENTINA',
      'BANCO NACIÓN ARGENTINA',
    ],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-nacion.png',
    shortName: 'Banco Nación',
    url: 'https://bna.com.ar/Personas?ref=comparatasas',
  },
  {
    names: ['BANCO SANTANDER ARGENTINA S.A.', 'Banco Santander', 'Santander', 'santander'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-santander.png',
    shortName: 'Banco Santander',
    url: 'https://www.santander.com.ar/personas?ref=comparatasas',
  },
  {
    names: ['BANCO DE GALICIA Y BUENOS AIRES S.A.U.', 'Banco Galicia', 'Galicia', 'galicia'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-galicia.png',
    shortName: 'Banco Galicia',
    url: 'https://www.galicia.ar/personas?ref=comparatasas',
  },
  {
    names: ['BANCO DE LA PROVINCIA DE BUENOS AIRES', 'Banco Provincia'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-provincia.png',
    shortName: 'Banco Provincia',
    url: 'https://www.bancoprovincia.com.ar/home/?ref=comparatasas',
  },
  {
    names: ['BBVA BANCO FRANCES S.A.', 'Banco BBVA Argentina S.A.', 'BBVA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bbva.png',
    shortName: 'BBVA',
    url: 'https://www.bbva.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO MACRO S.A.', 'Banco Macro'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-macro.png',
    shortName: 'Banco Macro',
    url: 'https://www.macro.com.ar/home-page?ref=comparatasas',
  },
  {
    names: ['HSBC BANK ARGENTINA S.A.', 'HSBC'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-hsbc.svg',
    shortName: 'HSBC',
    url: 'https://www.hsbc.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO CREDICOOP COOPERATIVO LIMITADO', 'Banco Credicoop'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-credicoop.png',
    shortName: 'Banco Credicoop',
    url: 'https://bancocredicoop.coop/?ref=comparatasas',
  },
  {
    names: ['INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ARGENTINA) S.A.U.', 'ICBC'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-icbc.png',
    shortName: 'ICBC',
    url: 'https://www.icbc.com.ar/personas?ref=comparatasas',
  },
  {
    names: ['BANCO DE LA CIUDAD DE BUENOS AIRES', 'Banco Ciudad'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-ciudad.png',
    shortName: 'Banco Ciudad',
    url: 'https://bancociudad.com.ar/institucional/?ref=comparatasas',
  },
  {
    names: ['Ualá', 'UALA', 'Uala'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá',
    url: 'https://www.uala.com.ar/?ref=comparatasas',
  },
  {
    names: ['UALA PLUS'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá Plus',
    url: 'https://www.uala.com.ar/?ref=comparatasas',
  },
  {
    names: ['UALA PLUS 1'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá Plus 1',
    url: 'https://www.uala.com.ar/?ref=comparatasas',
  },
  {
    names: ['UALA PLUS 2'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá Plus 2',
    url: 'https://www.uala.com.ar/?ref=comparatasas',
  },
  {
    names: ['Naranja X', 'NARANJA X'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/naranja.png',
    shortName: 'Naranja X',
    url: 'https://www.naranjax.com/?ref=comparatasas',
  },
  {
    names: ['Mercado Fondo', 'Mercado Pago', 'MERCADO PAGO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/mercado-pago.png',
    shortName: 'Mercado Pago',
    url: 'https://mercadopago.com.ar/?ref=comparatasas',
  },
  {
    names: ['Personal Pay'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/personal-pay.png',
    shortName: 'Personal Pay',
    url: 'https://personalpay.com.ar/?ref=comparatasas',
  },
  {
    names: ['Lemon', 'lemoncash'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/lemon.png',
    shortName: 'Lemon',
    url: 'https://lemon.me/?ref=comparatasas',
  },
  {
    names: ['Cocos'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/cocos.png',
    shortName: 'Cocos',
    url: 'https://cocos.capital/?ref=comparatasas',
  },
  {
    names: ['Nexo', 'NEXO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/nexo.png',
    shortName: 'Nexo',
    url: 'https://nexo.com/?ref=comparatasas.ar',
  },
  {
    names: ['Fiwind', 'FIWIND'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/fiwind.png',
    shortName: 'Fiwind',
    url: 'https://www.fiwind.io/?ref=comparatasas',
  },
  {
    names: ['Letsbit', 'LETSBIT'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/letsbit.png',
    shortName: 'LB',
    url: 'https://lbfinanzas.com/?ref=comparatasas',
  },
  {
    names: ['Belo', 'BELO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/belo.png',
    shortName: 'Belo',
    url: 'https://simple.belo.app/app/referral?referralCode=FERMINR1&useMarket=true&ref=comparatasas',
  },
  {
    names: ['Prex', 'PREX'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/prex.png',
    shortName: 'Prex',
    url: 'https://www.prexcard.com.ar/?ref=comparatasas',
  },
  {
    names: ['Supervielle', 'BANCO SUPERVIELLE', 'supervielle'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-supervielle.png',
    shortName: 'Supervielle',
    url: 'https://www.supervielle.com.ar/?ref=comparatasas',
  },
  {
    names: ['Banza'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banza.svg',
    shortName: 'Banza',
    url: 'https://www.banza.com.ar/?ref=comparatasas',
  },
  {
    names: ['Balanz'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/balanz.svg',
    shortName: 'Balanz',
    url: 'https://balanz.com/?ref=comparatasas',
  },
  {
    names: ['ieb', 'IEB'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/ieb.png',
    shortName: 'IEB+',
    url: 'https://www.iebmas.com.ar/?ref=comparatasas',
  },
  {
    names: ['macro'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-macro-acciones.svg',
    shortName: 'Macro',
    url: 'https://www.macro.com.ar/home-page?ref=comparatasas',
  },
  {
    names: ['Ripio', 'RIPIO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/ripio.png',
    shortName: 'Ripio',
    url: 'https://auth.ripio.com/?ref=comparatasas#/register/',
  },
  {
    names: ['BANCO COMAFI S.A.', 'Banco Comafi', 'COMAFI', 'BANCO COMAFI SOCIEDAD ANONIMA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-comafi.svg',
    shortName: 'Banco Comafi',
    url: 'https://www.comafi.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DE CORRIENTES S.A.', 'Banco de Corrientes', 'BANCO DE CORRIENTES'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-corrientes.svg',
    shortName: 'Banco de Corrientes',
    url: 'https://www.bancodecorrientes.com.ar/inicio/ref/comparatasas?ref=comparatasas',
  },
  {
    names: ['BANCO DE LA PROVINCIA DE CORDOBA S.A.', 'Banco de Córdoba', 'BANCOR', 'Bancor'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bancor.svg',
    shortName: 'Bancor',
    url: 'https://www.bancor.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO HIPOTECARIO S.A.', 'Banco Hipotecario', 'BHIP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-hipotecario.svg',
    shortName: 'Banco Hipotecario',
    url: 'https://www.hipotecario.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DEL SOL S.A.', 'Banco del Sol', 'BANCO DEL SOL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-del-sol.svg',
    shortName: 'Banco del Sol',
    url: 'https://bancodelsol.com/?ref=comparatasas',
  },
  {
    names: ['BANCO BICA S.A.', 'Banco BICA', 'BANCO BICA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-bica.svg',
    shortName: 'Banco BICA',
    url: 'https://bancobica.com.ar/?ref=comparatasas',
  },
  {
    names: ['CRÉDITO REGIONAL COMPAÑÍA FINANCIERA S.A.U.', 'Crédito Regional', 'CREDITO REGIONAL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/credito-regional.jpg',
    shortName: 'Crédito Regional',
    url: 'https://creditoregional.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO MERIDIAN S.A.', 'Banco Meridian', 'BANCO MERIDIAN'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-meridian.jpg',
    shortName: 'Banco Meridian',
    url: 'https://bancomeridian.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO VOII S.A.', 'Banco Voii', 'BANCO VOII'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-voii.jpg',
    shortName: 'Banco Voii',
    url: 'https://www.voii.com.ar/?ref=comparatasas',
  },
  {
    names: ['REBA COMPAÑIA FINANCIERA S.A.'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/reba.png',
    shortName: 'Reba',
    url: 'https://reba.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO CMF S.A.', 'Banco CMF', 'BANCO CMF'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-cmf.jpg',
    shortName: 'Banco CMF',
    url: 'https://bancocmf.com.ar/?ref=comparatasas',
  },
  {
    names: ['Banco Mariva', 'Banco Mariva S.A.'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-mariva.png',
    shortName: 'Banco Mariva',
    url: 'https://mariva.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DEL CHUBUT S.A.', 'Banco del Chubut', 'BANCO DEL CHUBUT'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-chubut.png',
    shortName: 'Banco del Chubut',
    url: 'https://bancochubut.com.ar/?ref=comparatasas',
  },
  {
    names: ['BIBANK S.A.', 'Bibank', 'BIBANK'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bibank.jpeg',
    shortName: 'Bibank',
    url: 'https://bibank.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO JULIO SOCIEDAD ANONIMA', 'Banco Julio', 'BANCO JULIO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-julio.jpeg',
    shortName: 'Banco Julio',
    url: 'https://www.bancojulio.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DINO S.A.', 'Banco Dino', 'BANCO DINO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-dino.png',
    shortName: 'Banco Dino',
    url: 'https://bancodino.com/?ref=comparatasas',
  },
  {
    names: ['BANCO MASVENTAS S.A.', 'Banco Masventas', 'BANCO MASVENTAS', 'BMV'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-masventas.jpeg',
    shortName: 'Banco Masventas',
    url: 'https://masventas.com.ar/?ref=comparatasas',
  },
  {
    names: ['Iol'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/iol.jpg',
    shortName: 'IOL',
    url: 'https://www.invertironline.com/?ref=comparatasas',
  },
  {
    names: ['astropay', 'Astropay', 'AstroPay'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/astropay.png',
    shortName: 'AstroPay',
    url: 'https://www.astropay.com/?ref=comparatasas',
  },
  {
    names: ['SBS', 'SBS Fondos', 'SBS Asset Management'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/sbs.jpg',
    shortName: 'SBS',
    url: 'https://sbsfondos.com/?ref=comparatasas',
  },
  {
    names: ['Adcap', 'adcap', 'ADCAP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/adcap.webp',
    shortName: 'Adcap',
    url: 'https://asset.ad-cap.com.ar/?ref=comparatasas',
  },
  {
    names: ['Allaria'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/allaria.jpg',
    shortName: 'Allaria',
    url: 'https://allaria.com.ar/?ref=comparatasas',
  },
  {
    names: ['Brubank', 'BRUBANK'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/brubank.png',
    shortName: 'Brubank',
    url: 'https://www.brubank.com/?ref=comparatasas',
  },
  {
    names: ['satoshitango', 'SatoshiTango', 'SATOSHITANGO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/satoshitango.jpg',
    shortName: 'SatoshiTango',
    url: 'https://www.satoshitango.com/?ref=comparatasas',
  },
  {
    names: ['stonex', 'StoneX', 'STONEX'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/stonex.jpg',
    shortName: 'StoneX',
    url: 'https://www.stonex.com/en/?ref=comparatasas',
  },
  {
    names: ['Bull Market'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bull-market.png',
    shortName: 'Bull Market',
    url: 'https://bullmarketbrokers.com/?ref=comparatasas',
  },
  {
    names: ['Galileo'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/galileo.png',
    shortName: 'Galileo',
    url: '#',
  },
  {
    names: ['Consultatio'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/consultatio.png',
    shortName: 'Consultatio',
    url: 'https://www.consultatio.com.ar/?ref=comparatasas',
  },
  {
    names: ['Delta'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/delta.png',
    shortName: 'Delta',
    url: '#',
  },
  {
    names: ['Cresium', 'cresium', 'CRESIUM'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/cresium.jpg',
    shortName: 'Cresium',
    url: 'https://cresium.com/?ref=comparatasas',
  },
  {
    names: ['toronto'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/toronto.png',
    shortName: 'Toronto',
    url: 'https://www.torontotrust.com.ar/?ref=comparatasas',
  },
  {
    names: ['BINANCE', 'Binance', 'binance'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/binance.png',
    shortName: 'Binance',
    url: 'https://www.binance.com/',
  },
  {
    names: ['BYBIT', 'Bybit', 'bybit'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bybit.png',
    shortName: 'Bybit',
    url: 'https://www.bybit.com/',
  },
  {
    names: ['OKEX', 'OKX', 'okex', 'okx'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/okx.png',
    shortName: 'OKX',
    url: 'https://www.okx.com/',
  },
  {
    names: ['BITGET', 'Bitget', 'bitget'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bitget.png',
    shortName: 'Bitget',
    url: 'https://www.bitget.com/',
  },
  {
    names: ['CRYPTO_COM', 'Crypto.com', 'crypto.com', 'CRYPTO.COM'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/crypto-com.png',
    shortName: 'Crypto.com',
    url: 'https://crypto.com/',
  },
  {
    names: ['KUCOIN', 'KuCoin', 'kucoin'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/kucoin.png',
    shortName: 'KuCoin',
    url: 'https://www.kucoin.com/',
  },
  {
    names: ['Claro Pay'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/claropay.svg',
    shortName: 'Claro Pay',
    url: 'https://claropay.com.ar/',
  },
  {
    names: ['CARREFOUR BANCO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/carrefour-banco.png',
    shortName: 'Carrefour Banco',
    url: 'https://www.bancodeserviciosfinancieros.com.ar/?ref=comparatasas.ar',
  },
  {
    names: ['lucamoney', 'LucaMoney', 'LUCA MONEY'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/lucamoney.png',
    shortName: 'LucaMoney',
    url: 'https://www.lucamoney.com/?ref=comparatasas',
  },
  {
    names: ['BANCO PATAGONIA S.A.', 'Banco Patagonia', 'Patagonia'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-patagonia.svg',
    shortName: 'Banco Patagonia',
    url: 'https://www.bancopatagonia.com.ar/?ref=comparatasas.ar',
  },
  {
    names: ['decrypto', 'Decrypto', 'DECRYPTO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/decrypto.svg',
    shortName: 'Decrypto',
    url: 'https://www.decrypto.la/?ref=comparatasas',
  },
  {
    names: ['vesseo', 'Vesseo', 'VESSEO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/vesseo.svg',
    shortName: 'Vesseo',
    url: 'https://vesseoapp.com/?ref=comparatasas.ar',
  },
]

export function getInstitutionLogo(name: string): string | undefined {
  const key = name.trim().toLowerCase()

  for (const inst of institutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.logo
    }
  }

  return undefined
}

export function getInstitutionShortName(name: string): string {
  const key = name.trim().toLowerCase()

  for (const inst of institutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.shortName
    }
  }

  return name
}

export function getInstitutionUrl(name: string): string | undefined {
  const key = name.trim().toLowerCase()

  for (const inst of institutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.url
    }
  }

  return undefined
}
