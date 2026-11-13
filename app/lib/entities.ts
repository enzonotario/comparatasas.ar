import { resolveProviderLogo } from './charts/provider-logos'
import { getInstitutionUrl } from './mappings/institutions'

export type EntityType = 'banco' | 'billetera' | 'broker' | 'remesadora' | 'otro'

export interface Entity {
  slug: string
  name: string
  type: EntityType
  /**
   * Names used by the upstream sources (BCRA legal names, API codes, commercial
   * names, product variants). Matched after `normalizeEntityName`, so case,
   * accents, spacing and punctuation variants do not need their own alias.
   */
  aliases: string[]
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  banco: 'Banco',
  billetera: 'Billetera',
  broker: 'Broker',
  remesadora: 'Remesadora',
  otro: 'Otra entidad',
}

export const ENTITIES: Entity[] = [
  // Bancos
  {
    slug: 'banco-nacion',
    name: 'Banco Nación',
    type: 'banco',
    aliases: ['BNA', 'Banco de la Nación Argentina', 'Banco Nación Argentina'],
  },
  {
    slug: 'banco-galicia',
    name: 'Banco Galicia',
    type: 'banco',
    aliases: [
      'Galicia',
      'BANCO DE GALICIA Y BUENOS AIRES S.A.',
      'BANCO DE GALICIA Y BUENOS AIRES S.A.U.',
    ],
  },
  {
    slug: 'bbva',
    name: 'BBVA',
    type: 'banco',
    aliases: ['BANCO BBVA ARGENTINA S.A.', 'BBVA BANCO FRANCES S.A.', 'BBVA BANCO ARGENTINA'],
  },
  {
    slug: 'banco-santander',
    name: 'Banco Santander',
    type: 'banco',
    aliases: ['Santander', 'BANCO SANTANDER ARGENTINA S.A.'],
  },
  {
    slug: 'banco-provincia',
    name: 'Banco Provincia',
    type: 'banco',
    aliases: ['Provincia', 'BANCO DE LA PROVINCIA DE BUENOS AIRES', 'Cuenta DNI'],
  },
  {
    slug: 'banco-macro',
    name: 'Banco Macro',
    type: 'banco',
    aliases: ['Macro', 'BANCO MACRO S.A.'],
  },
  {
    slug: 'icbc',
    name: 'ICBC',
    type: 'banco',
    aliases: ['INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ARGENTINA) S.A.U.'],
  },
  {
    slug: 'banco-ciudad',
    name: 'Banco Ciudad',
    type: 'banco',
    aliases: ['Ciudad', 'BANCO DE LA CIUDAD DE BUENOS AIRES'],
  },
  {
    slug: 'banco-patagonia',
    name: 'Banco Patagonia',
    type: 'banco',
    aliases: ['Patagonia', 'BANCO PATAGONIA S.A.'],
  },
  {
    slug: 'banco-credicoop',
    name: 'Banco Credicoop',
    type: 'banco',
    aliases: ['Credicoop', 'BANCO CREDICOOP COOPERATIVO LIMITADO'],
  },
  {
    slug: 'banco-bica',
    name: 'Banco BICA',
    type: 'banco',
    aliases: [
      'BICA',
      'BANCO BICA S.A.',
      'BICA CUENTA POSITIVA 1',
      'BICA CUENTA POSITIVA 2',
      'BICA CUENTA POSITIVA 3',
      'BICA CUENTA POSITIVA 4',
    ],
  },
  { slug: 'banco-cmf', name: 'Banco CMF', type: 'banco', aliases: ['CMF', 'BANCO CMF S.A.'] },
  {
    slug: 'banco-comafi',
    name: 'Banco Comafi',
    type: 'banco',
    aliases: ['Comafi', 'BANCO COMAFI S.A.', 'BANCO COMAFI SOCIEDAD ANONIMA'],
  },
  {
    slug: 'banco-de-comercio',
    name: 'Banco de Comercio',
    type: 'banco',
    aliases: ['BANCO DE COMERCIO S.A.'],
  },
  {
    slug: 'banco-de-formosa',
    name: 'Banco de Formosa',
    type: 'banco',
    aliases: ['BANCO DE FORMOSA S.A.'],
  },
  {
    slug: 'bancor',
    name: 'Bancor',
    type: 'banco',
    aliases: ['Banco de Córdoba', 'BANCO DE LA PROVINCIA DE CORDOBA S.A.'],
  },
  {
    slug: 'banco-del-chubut',
    name: 'Banco del Chubut',
    type: 'banco',
    aliases: ['Chubut', 'Banco de Chubut', 'BANCO DEL CHUBUT S.A.'],
  },
  {
    slug: 'banco-del-sol',
    name: 'Banco del Sol',
    type: 'banco',
    aliases: ['BANCO DEL SOL S.A.'],
  },
  { slug: 'banco-dino', name: 'Banco Dino', type: 'banco', aliases: ['BANCO DINO S.A.'] },
  {
    slug: 'banco-hipotecario',
    name: 'Banco Hipotecario',
    type: 'banco',
    aliases: ['Hipotecario', 'BHIP', 'BANCO HIPOTECARIO S.A.'],
  },
  {
    slug: 'banco-julio',
    name: 'Banco Julio',
    type: 'banco',
    aliases: ['BANCO JULIO SOCIEDAD ANONIMA'],
  },
  {
    slug: 'banco-mariva',
    name: 'Banco Mariva',
    type: 'banco',
    aliases: ['Mariva', 'BANCO MARIVA S.A.'],
  },
  {
    slug: 'banco-masventas',
    name: 'Banco Masventas',
    type: 'banco',
    aliases: ['BMV', 'BANCO MASVENTAS S.A.'],
  },
  {
    slug: 'banco-meridian',
    name: 'Banco Meridian',
    type: 'banco',
    aliases: ['BANCO MERIDIAN S.A.'],
  },
  {
    slug: 'banco-tierra-del-fuego',
    name: 'Banco Tierra del Fuego',
    type: 'banco',
    aliases: [
      'BTF',
      'BANCO PROVINCIA DE TIERRA DEL FUEGO',
      'BANCO DE LA PROVINCIA DE TIERRA DEL FUEGO',
    ],
  },
  {
    slug: 'banco-voii',
    name: 'Banco Voii',
    type: 'banco',
    aliases: ['VOII', 'BANCO VOII S.A.'],
  },
  { slug: 'bibank', name: 'Bibank', type: 'banco', aliases: ['BIBANK S.A.'] },
  { slug: 'banco-piano', name: 'Banco Piano', type: 'banco', aliases: ['Piano'] },
  { slug: 'brubank', name: 'Brubank', type: 'banco', aliases: [] },
  {
    slug: 'supervielle',
    name: 'Supervielle',
    type: 'banco',
    aliases: ['Banco Supervielle', 'SUPERVIELLE HIT IOL'],
  },
  {
    slug: 'banco-de-corrientes',
    name: 'Banco de Corrientes',
    type: 'banco',
    aliases: ['BANCO DE CORRIENTES S.A.'],
  },
  {
    slug: 'carrefour-banco',
    name: 'Carrefour Banco',
    type: 'banco',
    aliases: ['Carrefour'],
  },
  { slug: 'grupo-petersen', name: 'Grupo Petersen', type: 'banco', aliases: [] },
  {
    slug: 'credito-regional',
    name: 'Crédito Regional',
    type: 'otro',
    aliases: ['CRÉDITO REGIONAL COMPAÑÍA FINANCIERA S.A.U.'],
  },
  { slug: 'reba', name: 'Reba', type: 'otro', aliases: ['REBA COMPAÑIA FINANCIERA S.A.'] },

  // Billeteras
  {
    slug: 'uala',
    name: 'Ualá',
    type: 'billetera',
    aliases: ['UALA PLUS', 'UALA PLUS 1', 'UALA PLUS 2', 'Ualá Bis'],
  },
  {
    slug: 'naranja-x',
    name: 'Naranja X',
    type: 'billetera',
    aliases: [
      'Naranja',
      'NARANJA X FRASCOS 7-13',
      'NARANJA X FRASCOS 14-27',
      'NARANJA X FRASCOS 28',
    ],
  },
  {
    slug: 'mercado-pago',
    name: 'Mercado Pago',
    type: 'billetera',
    aliases: ['Mercado Fondo'],
  },
  { slug: 'personal-pay', name: 'Personal Pay', type: 'billetera', aliases: [] },
  { slug: 'claro-pay', name: 'Claro Pay', type: 'billetera', aliases: [] },
  { slug: 'cencopay', name: 'CencoPay', type: 'billetera', aliases: [] },
  { slug: 'ypf', name: 'YPF', type: 'billetera', aliases: [] },
  { slug: 'belo', name: 'Belo', type: 'billetera', aliases: [] },
  { slug: 'fiwind', name: 'Fiwind', type: 'billetera', aliases: [] },
  { slug: 'lemon', name: 'Lemon', type: 'billetera', aliases: ['lemoncash'] },
  { slug: 'prex', name: 'Prex', type: 'billetera', aliases: [] },
  { slug: 'astropay', name: 'AstroPay', type: 'billetera', aliases: [] },
  { slug: 'letsbit', name: 'Letsbit', type: 'billetera', aliases: ['LB Finanzas'] },
  { slug: 'capyfi', name: 'CapyFi', type: 'billetera', aliases: [] },
  { slug: 'ripio', name: 'Ripio', type: 'billetera', aliases: [] },
  { slug: 'nexo', name: 'Nexo', type: 'billetera', aliases: [] },
  { slug: 'satoshitango', name: 'SatoshiTango', type: 'billetera', aliases: [] },
  { slug: 'lucamoney', name: 'LucaMoney', type: 'billetera', aliases: ['Luca Money'] },
  { slug: 'decrypto', name: 'Decrypto', type: 'billetera', aliases: [] },
  { slug: 'vesseo', name: 'Vesseo', type: 'billetera', aliases: [] },
  { slug: 'lunefi', name: 'Lune.fi', type: 'billetera', aliases: [] },
  { slug: 'berry', name: 'Berry', type: 'billetera', aliases: [] },
  {
    slug: 'montemar-pay',
    name: 'Montemar Pay',
    type: 'billetera',
    aliases: ['Montemar'],
  },
  { slug: 'cresium', name: 'Cresium', type: 'billetera', aliases: [] },

  // Brokers y sociedades de inversión
  { slug: 'cocos', name: 'Cocos', type: 'broker', aliases: ['Cocos Ahorro'] },
  {
    slug: 'allaria',
    name: 'Allaria',
    type: 'broker',
    aliases: ['Allaria Inversiones'],
  },
  { slug: 'balanz', name: 'Balanz', type: 'broker', aliases: [] },
  {
    slug: 'bull-market',
    name: 'Bull Market',
    type: 'broker',
    aliases: ['Bull Market Brokers'],
  },
  { slug: 'eco-valores', name: 'Eco Valores', type: 'broker', aliases: [] },
  { slug: 'five', name: 'Five', type: 'broker', aliases: [] },
  {
    slug: 'galicia-securities',
    name: 'Galicia Securities',
    type: 'broker',
    aliases: [],
  },
  { slug: 'ieb', name: 'IEB+', type: 'broker', aliases: ['IEB', 'iebmas', 'IEB MAS'] },
  { slug: 'iol', name: 'IOL', type: 'broker', aliases: ['InvertirOnline'] },
  {
    slug: 'macro-securities',
    name: 'Macro Securities',
    type: 'broker',
    aliases: [],
  },
  {
    slug: 'ppi',
    name: 'PPI',
    type: 'broker',
    aliases: ['Portfolio Personal', 'Portfolio Personal Inversiones'],
  },
  { slug: 'puente', name: 'Puente', type: 'broker', aliases: [] },
  { slug: 'rava', name: 'Rava', type: 'broker', aliases: ['Rava Bursátil'] },
  {
    slug: 'sbs',
    name: 'SBS',
    type: 'broker',
    aliases: ['SBS Trading', 'SBS Fondos', 'SBS Asset Management'],
  },
  { slug: 'adcap', name: 'Adcap', type: 'broker', aliases: [] },
  { slug: 'max-capital', name: 'Max Capital', type: 'broker', aliases: [] },
  { slug: 'wise-capital', name: 'Wise Capital', type: 'broker', aliases: [] },
  { slug: 'grupo-st', name: 'Grupo ST', type: 'broker', aliases: ['GST'] },
  { slug: 'stonex', name: 'StoneX', type: 'broker', aliases: [] },
  { slug: 'toronto-trust', name: 'Toronto Trust', type: 'otro', aliases: ['Toronto'] },

  // Procesadores de cobro
  { slug: 'getnet', name: 'Getnet', type: 'otro', aliases: [] },
  { slug: 'payway', name: 'Payway', type: 'otro', aliases: [] },
  { slug: 'sipago', name: 'Sipago', type: 'otro', aliases: [] },
  { slug: 'viumi', name: 'Viumi', type: 'otro', aliases: ['Argenpay'] },

  // Remesadoras y cuentas en el exterior
  { slug: 'global66', name: 'Global66', type: 'remesadora', aliases: [] },
  { slug: 'airtm', name: 'Airtm', type: 'remesadora', aliases: [] },
  { slug: 'arq', name: 'ARQ', type: 'remesadora', aliases: ['DolarApp'] },
  { slug: 'grabrfi', name: 'GrabrFi', type: 'remesadora', aliases: ['Grabr'] },
  { slug: 'payoneer', name: 'Payoneer', type: 'remesadora', aliases: [] },
  { slug: 'takenos', name: 'Takenos', type: 'remesadora', aliases: [] },
  { slug: 'wallbit', name: 'Wallbit', type: 'remesadora', aliases: [] },
  { slug: 'wise', name: 'Wise', type: 'remesadora', aliases: [] },
]

/** Strips accents, lowercases and drops every non `[a-z0-9]` character. */
export function normalizeEntityName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const entityBySlug = new Map(ENTITIES.map((entity) => [entity.slug, entity]))

const slugByName = new Map<string, string>()
for (const entity of ENTITIES) {
  for (const name of [entity.name, entity.slug, ...entity.aliases]) {
    const key = normalizeEntityName(name)
    if (key) slugByName.set(key, entity.slug)
  }
}

export function resolveEntitySlug(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  return slugByName.get(normalizeEntityName(name))
}

export function getEntityBySlug(slug: string): Entity | undefined {
  return entityBySlug.get(slug)
}

function entityNames(entity: Entity): string[] {
  return [entity.name, ...entity.aliases]
}

/** First logo the existing logo helpers know for the entity name or aliases. */
export function getEntityLogo(entity: Entity): string | undefined {
  for (const name of entityNames(entity)) {
    const logo = resolveProviderLogo(name)
    if (logo) return logo
  }
  return undefined
}

/** Outbound URL (with UTM) from the institutions registry. */
export function getEntityUrl(entity: Entity, medium = 'entidades'): string | undefined {
  for (const name of entityNames(entity)) {
    const url = getInstitutionUrl(name, medium)
    if (url && url !== '#') return url
  }
  return undefined
}
