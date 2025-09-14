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
      'banco nacion',
      'Banco de la Nación Argentina',
      'banco de la nacion argentina',
      'BANCO DE LA NACION ARGENTINA',
    ],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-nacion.png',
    shortName: 'Banco Nación',
    url: 'https://dub.link/06hKI5u',
  },
  {
    names: ['BANCO SANTANDER ARGENTINA S.A.', 'Banco Santander', 'Santander'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-santander.png',
    shortName: 'Banco Santander',
    url: 'https://dub.link/O84uvr0',
  },
  {
    names: ['BANCO DE GALICIA Y BUENOS AIRES S.A.U.', 'Banco Galicia', 'Galicia'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-galicia.png',
    shortName: 'Banco Galicia',
    url: 'https://dub.link/MJadlcT',
  },
  {
    names: ['BANCO DE LA PROVINCIA DE BUENOS AIRES', 'Banco Provincia'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-provincia.png',
    shortName: 'Banco Provincia',
    url: 'https://dub.link/HoBi0ZE',
  },
  {
    names: ['BBVA BANCO FRANCES S.A.', 'Banco BBVA Argentina S.A.', 'BBVA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bbva.png',
    shortName: 'BBVA',
    url: 'https://dub.link/HhNEEaJ',
  },
  {
    names: ['BANCO MACRO S.A.', 'Banco Macro'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-macro.png',
    shortName: 'Banco Macro',
    url: 'https://dub.link/WOxBUix',
  },
  {
    names: ['HSBC BANK ARGENTINA S.A.', 'HSBC'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-hsbc.svg',
    shortName: 'HSBC',
    url: 'https://dub.link/15s98QO',
  },
  {
    names: ['BANCO CREDICOOP COOPERATIVO LIMITADO', 'Banco Credicoop'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-credicoop.png',
    shortName: 'Banco Credicoop',
    url: 'https://dub.link/8l1W3Zh',
  },
  {
    names: ['INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ARGENTINA) S.A.U.', 'ICBC'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-icbc.png',
    shortName: 'ICBC',
    url: 'https://dub.link/oBX56Oo',
  },
  {
    names: ['BANCO DE LA CIUDAD DE BUENOS AIRES', 'Banco Ciudad'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-ciudad.png',
    shortName: 'Banco Ciudad',
    url: 'https://dub.link/wLvJ5ex',
  },
  {
    names: ['Ualá', 'UALA', 'Uala'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá',
    url: 'https://dub.link/xxanS0I',
  },
  {
    names: ['Naranja X', 'NARANJA X'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/naranja.png',
    shortName: 'Naranja X',
    url: 'https://dub.link/5SOTJy7',
  },
  {
    names: ['Mercado Fondo', 'Mercado Pago', 'MERCADO PAGO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/mercado-pago.png',
    shortName: 'Mercado Pago',
    url: 'https://dub.link/H7438WE',
  },
  {
    names: ['Personal Pay'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/personal-pay.png',
    shortName: 'Personal Pay',
    url: 'https://dub.link/UOuDEBV',
  },
  {
    names: ['Lemon', 'lemoncash'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/lemon.png',
    shortName: 'Lemon',
    url: 'https://dub.link/AnVgzoc',
  },
  {
    names: ['Cocos'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/cocos.png',
    shortName: 'Cocos',
    url: 'https://dub.link/RBrqEXt',
  },
  {
    names: ['Buenbit', 'BUENBIT'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/buenbit.png',
    shortName: 'Buenbit',
    url: 'https://dub.link/5tVftQu',
  },
  {
    names: ['Fiwind', 'FIWIND'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/fiwind.png',
    shortName: 'Fiwind',
    url: 'https://dub.link/4hbGuN0',
  },
  {
    names: ['Letsbit', 'LETSBIT'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/letsbit.png',
    shortName: 'LB',
    url: 'https://dub.link/85b8upH',
  },
  {
    names: ['Belo', 'BELO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/belo.png',
    shortName: 'Belo',
    url: 'https://dub.link/cFeuDyC',
  },
  {
    names: ['Prex', 'PREX'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/prex.png',
    shortName: 'Prex',
    url: 'https://dub.link/sSXjtaY',
  },
  {
    names: ['Supervielle'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-supervielle.png',
    shortName: 'Supervielle',
    url: 'https://dub.link/vIFomxq',
  },
  {
    names: ['Banza'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banza.svg',
    shortName: 'Banza',
    url: 'https://dub.link/fejKmwk',
  },
  {
    names: ['Balanz'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/balanz.svg',
    shortName: 'Balanz',
    url: 'https://dub.link/58UWnJ0',
  },
  {
    names: ['ieb', 'IEB'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/ieb.png',
    shortName: 'IEB+',
    url: 'https://dub.link/WRpp6ov',
  },
  {
    names: ['macro'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-macro-acciones.svg',
    shortName: 'Macro',
    url: 'https://dub.link/WOxBUix',
  },
  {
    names: ['Ripio', 'RIPIO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/ripio.png',
    shortName: 'Ripio',
    url: 'https://dub.link/BOUZvK6',
  },
  {
    names: ['BANCO COMAFI S.A.', 'Banco Comafi', 'COMAFI', 'BANCO COMAFI SOCIEDAD ANONIMA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-comafi.svg',
    shortName: 'Banco Comafi',
    url: 'https://dub.link/EFKFjvO',
  },
  {
    names: ['BANCO DE CORRIENTES S.A.', 'Banco de Corrientes', 'BANCO DE CORRIENTES'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-corrientes.svg',
    shortName: 'Banco de Corrientes',
    url: 'https://dub.link/sLxOTTB',
  },
  {
    names: ['BANCO DE LA PROVINCIA DE CORDOBA S.A.', 'Banco de Córdoba', 'BANCOR', 'Bancor'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bancor.svg',
    shortName: 'Bancor',
    url: 'https://dub.link/Q8dfyWO',
  },
  {
    names: ['BANCO HIPOTECARIO S.A.', 'Banco Hipotecario', 'BHIP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-hipotecario.svg',
    shortName: 'Banco Hipotecario',
    url: 'https://dub.link/Y8FLTWY',
  },
  {
    names: ['BANCO DEL SOL S.A.', 'Banco del Sol', 'BANCO DEL SOL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-del-sol.svg',
    shortName: 'Banco del Sol',
    url: 'https://dub.link/W2JuZJh',
  },
  {
    names: ['BANCO BICA S.A.', 'Banco BICA', 'BANCO BICA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-bica.svg',
    shortName: 'Banco BICA',
    url: 'https://dub.link/MAEXBeS',
  },
  {
    names: ['CRÉDITO REGIONAL COMPAÑÍA FINANCIERA S.A.U.', 'Crédito Regional', 'CREDITO REGIONAL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/credito-regional.jpg',
    shortName: 'Crédito Regional',
    url: 'https://dub.link/oTmsX4N',
  },
  {
    names: ['BANCO MERIDIAN S.A.', 'Banco Meridian', 'BANCO MERIDIAN'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-meridian.jpg',
    shortName: 'Banco Meridian',
    url: 'https://dub.link/xCCBwDF',
  },
  {
    names: ['BANCO VOII S.A.', 'Banco Voii', 'BANCO VOII'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-voii.jpg',
    shortName: 'Banco Voii',
    url: 'https://dub.link/0oR2xZa',
  },
  {
    names: ['REBA COMPAÑIA FINANCIERA S.A.'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/reba.png',
    shortName: 'Reba',
    url: 'https://dub.link/5kwwwTo',
  },
  {
    names: ['BANCO CMF S.A.', 'Banco CMF', 'BANCO CMF'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-cmf.jpg',
    shortName: 'Banco CMF',
    url: 'https://dub.link/yYawPyT',
  },
  {
    names: ['Banco Mariva', 'Banco Mariva S.A.'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-mariva.png',
    shortName: 'Banco Mariva',
    url: 'https://dub.link/DKz4zWf',
  },
  {
    names: ['BANCO DEL CHUBUT S.A.', 'Banco del Chubut', 'BANCO DEL CHUBUT'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-chubut.png',
    shortName: 'Banco del Chubut',
    url: 'https://dub.link/V5kMIMU',
  },
  {
    names: ['BIBANK S.A.', 'Bibank', 'BIBANK'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bibank.jpeg',
    shortName: 'Bibank',
    url: 'https://dub.link/ozYgR75',
  },
  {
    names: ['BANCO JULIO SOCIEDAD ANONIMA', 'Banco Julio', 'BANCO JULIO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-julio.jpeg',
    shortName: 'Banco Julio',
    url: 'https://dub.link/wURLmB2',
  },
  {
    names: ['BANCO DINO S.A.', 'Banco Dino', 'BANCO DINO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-dino.png',
    shortName: 'Banco Dino',
    url: 'https://dub.link/GrnlYMi',
  },
  {
    names: ['BANCO MASVENTAS S.A.', 'Banco Masventas', 'BANCO MASVENTAS', 'BMV'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-masventas.jpeg',
    shortName: 'Banco Masventas',
    url: 'https://dub.link/wFScf4J',
  },
  {
    names: ['Iol'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/iol.jpg',
    shortName: 'IOL',
    url: 'https://dub.link/VhlkWOd',
  },
  {
    names: ['astropay', 'Astropay'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/astropay.png',
    shortName: 'Astropay',
    url: 'https://dub.link/BgFIde3',
  },
  {
    names: ['SBS', 'SBS Fondos', 'SBS Asset Management'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/sbs.jpg',
    shortName: 'SBS',
    url: 'https://dub.link/v7RDk9z',
  },
  {
    names: ['Adcap', 'adcap', 'ADCAP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/adcap.webp',
    shortName: 'Adcap',
    url: 'https://dub.link/cfE5Tod',
  },
  {
    names: ['Allaria'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/allaria.jpg',
    shortName: 'Allaria',
    url: 'https://dub.link/W1o0MGQ',
  },
  {
    names: ['Brubank', 'BRUBANK'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/brubank.png',
    shortName: 'Brubank',
    url: 'https://dub.link/QV9AM5y',
  },
  {
    names: ['satoshitango', 'SatoshiTango', 'SATOSHITANGO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/satoshitango.jpg',
    shortName: 'SatoshiTango',
    url: 'https://dub.link/XxT0Vnd',
  },
  {
    names: ['stonex', 'StoneX', 'STONEX'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/stonex.jpg',
    shortName: 'StoneX',
    url: 'https://dub.link/zAOjY0f',
  },
  {
    names: ['Bull Market'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bull-market.png',
    shortName: 'Bull Market',
    url: 'https://dub.link/kRnfnkM',
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
    url: 'https://dub.link/tWlaUch',
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
    url: 'https://dub.link/KXLtT0o',
  },
  {
    names: ['toronto'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/toronto.png',
    shortName: 'Toronto',
    url: 'https://dub.sh/nRrN2Nz',
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
