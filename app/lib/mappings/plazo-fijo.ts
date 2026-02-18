export interface PlazoFijoInfo {
  logo: string
  url?: string
}

export const plazoFijoInstitutions: Array<{
  names: string[]
  logo?: string
  shortName: string
  url: string
}> = [
  {
    names: [
      'BANCO DE LA NACION ARGENTINA',
      'banco nacion',
      'Banco de la Nación Argentina',
      'Banco Nación',
    ],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-nacion.png',
    shortName: 'Banco Nación',
    url: 'https://bna.com.ar/Personas?ref=comparatasas',
  },
  {
    names: ['BANCO SANTANDER ARGENTINA S.A.', 'Banco Santander'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-santander.png',
    shortName: 'Banco Santander',
    url: 'https://www.santander.com.ar/personas?ref=comparatasas',
  },
  {
    names: ['BANCO DE GALICIA Y BUENOS AIRES S.A.U.', 'Banco Galicia', 'Galicia+'],
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
    names: ['BANCO BBVA ARGENTINA S.A.', 'BBVA BANCO FRANCES S.A.', 'BBVA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/bbva.png',
    shortName: 'BBVA',
    url: 'https://www.bbva.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO MACRO S.A.', 'Banco Macro', 'Macro'],
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
    names: ['BANCO BICA S.A.', 'Banco BICA', 'BANCO BICA'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-bica.svg',
    shortName: 'Banco BICA',
    url: 'https://bancobica.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO CMF S.A.', 'Banco CMF', 'BANCO CMF'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-cmf.jpg',
    shortName: 'Banco CMF',
    url: 'https://bancocmf.com.ar/?ref=comparatasas',
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
    names: ['BANCO DEL CHUBUT S.A.', 'Banco del Chubut', 'BANCO DEL CHUBUT'],
    shortName: 'Banco del Chubut',
    url: 'https://bancochubut.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DEL SOL S.A.', 'Banco del Sol', 'BANCO DEL SOL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-del-sol.svg',
    shortName: 'Banco del Sol',
    url: 'https://bancodelsol.com/?ref=comparatasas',
  },
  {
    names: ['BANCO DINO S.A.', 'Banco Dino', 'BANCO DINO'],
    shortName: 'Banco Dino',
    url: 'https://bancodino.com/?ref=comparatasas',
  },
  {
    names: ['BANCO HIPOTECARIO S.A.', 'Banco Hipotecario', 'BHIP'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-hipotecario.svg',
    shortName: 'Banco Hipotecario',
    url: 'https://www.hipotecario.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO JULIO SOCIEDAD ANONIMA', 'Banco Julio', 'BANCO JULIO'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-julio.jpeg',
    shortName: 'Banco Julio',
    url: 'https://www.bancojulio.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO MASVENTAS S.A.', 'Banco Masventas', 'BANCO MASVENTAS', 'BMV'],
    shortName: 'Banco Masventas',
    url: 'https://masventas.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO MERIDIAN S.A.', 'Banco Meridian', 'BANCO MERIDIAN'],
    shortName: 'Banco Meridian',
    url: 'https://bancomeridian.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO TIERRA DEL FUEGO', 'Banco Tierra del Fuego', 'BTF'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-tierra-del-fuego.png',
    shortName: 'Banco Tierra del Fuego',
    url: 'https://www.btf.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO VOII S.A.', 'Banco Voii', 'BANCO VOII'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/banco-voii.jpg',
    shortName: 'Banco Voii',
    url: 'https://www.voii.com.ar/?ref=comparatasas',
  },
  {
    names: ['BIBANK S.A.', 'Bibank', 'BIBANK'],
    shortName: 'Bibank',
    url: 'https://bibank.com.ar/?ref=comparatasas',
  },
  {
    names: ['CRÉDITO REGIONAL COMPAÑÍA FINANCIERA S.A.U.', 'Crédito Regional', 'CREDITO REGIONAL'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/credito-regional.jpg',
    shortName: 'Crédito Regional',
    url: 'https://creditoregional.com.ar/?ref=comparatasas',
  },
  {
    names: ['Banco Mariva', 'Banco Mariva S.A.'],
    shortName: 'Banco Mariva',
    url: 'https://mariva.com.ar/?ref=comparatasas',
  },
  {
    names: ['REBA COMPAÑIA FINANCIERA S.A.', 'Reba'],
    shortName: 'Reba',
    url: 'https://reba.com.ar/?ref=comparatasas',
  },
  {
    names: ['BANCO DE FORMOSA S.A.', 'Banco de Formosa'],
    shortName: 'Banco de Formosa',
    url: 'https://www.bancoformosa.com.ar/simulador-plazo-fijo.aspx',
  },
  {
    names: ['UALA', 'Ualá', 'UALÁ'],
    logo: 'https://api.argentinadatos.com/static/comparatasas/logos/uala.png',
    shortName: 'Ualá',
    url: 'https://www.uala.com.ar/?ref=comparatasas',
  },
]

export function getPlazoFijoLogo(name: string): string | undefined {
  const key = name.trim().toLowerCase()

  for (const inst of plazoFijoInstitutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.logo
    }
  }

  return undefined
}

export function getPlazoFijoShortName(name: string): string {
  const key = name.trim().toLowerCase()

  for (const inst of plazoFijoInstitutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.shortName
    }
  }

  return name
}

export function getPlazoFijoUrl(name: string): string | undefined {
  const key = name.trim().toLowerCase()

  for (const inst of plazoFijoInstitutions) {
    if (inst.names.map((n) => n.toLowerCase()).includes(key)) {
      return inst.url
    }
  }

  return undefined
}
