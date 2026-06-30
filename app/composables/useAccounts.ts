import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { getLogoForEntity } from '~/lib/mappings/logos'
import { isBlacklisted } from '~/lib/blacklist'
import {
  extractFrascosTiers,
  isFrascosFondo,
  type AccountPlazoTier,
} from '~/lib/account-plazo-tiers'

export type { AccountPlazoTier }

export interface ApiAccount {
  fondo: string
  tna: number
  tea?: number
  tope: number | null
  fecha?: string
  condiciones?: string
  condicionesCorto?: string
  plazoMinDias?: number | null
  plazoMaxDias?: number | null
}

export interface AccountItem {
  fondo: string
  tna: number
  tea: number
  tope: number | null
  fecha?: string
  fechaAnterior?: string
  logo?: string
  condiciones?: string
  condicionesCorto?: string
  type?: string
  typeLabel?: string
  url?: string
  plazoMinDias?: number
  plazoMaxDias?: number | null
  plazoTiers?: AccountPlazoTier[]
}

function buildFrascosAccountItem(frascosRaw: ApiAccount[]): AccountItem | null {
  const tiers = extractFrascosTiers(frascosRaw)
  if (!tiers.length) return null

  const first = frascosRaw[0]!
  const maxTna = Math.max(...tiers.map((t) => t.tna))
  const bestTier = tiers.find((t) => t.tna === maxTna) ?? tiers[tiers.length - 1]!

  return {
    fondo: 'Frascos Naranja X',
    tna: maxTna,
    tea: bestTier.tea,
    tope: first.tope,
    fecha: first.fecha,
    logo: getLogoForEntity('NARANJA X') || getInstitutionLogo('NARANJA X'),
    type: 'cuentaRemunerada',
    typeLabel: 'Frascos',
    condiciones: first.condiciones,
    condicionesCorto: 'Rendimiento según plazo elegido (7, 14 o 28 días)',
    url: getInstitutionUrl('NARANJA X'),
    plazoTiers: tiers,
  }
}

export function useAccounts() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('accounts', () =>
    $fetch<ApiAccount[]>('https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo'),
  )

  function mapApiAccountToAccountItem(a: ApiAccount): AccountItem {
    return {
      fondo: getInstitutionShortName(a.fondo) || a.fondo,
      tna: a.tna,
      tea: a.tea ?? 0,
      tope: a.tope,
      fecha: a.fecha,
      logo: getLogoForEntity(a.fondo) || getInstitutionLogo(a.fondo),
      type: ['FIWIND', 'BELO'].includes(a.fondo.toUpperCase()) ? 'billetera' : 'cuentaRemunerada',
      typeLabel: ['FIWIND', 'BELO'].includes(a.fondo.toUpperCase())
        ? 'Billetera'
        : 'Cuenta Remunerada',
      condiciones: a.condiciones,
      condicionesCorto: a.condicionesCorto,
      url: getInstitutionUrl(a.fondo),
      plazoMinDias: a.plazoMinDias ?? undefined,
      plazoMaxDias: a.plazoMaxDias ?? undefined,
    }
  }

  function filterAndMapAccounts(fundNames: string[]): AccountItem[] {
    return (data.value ?? [])
      .filter((a) => fundNames.includes(a.fondo) && !isBlacklisted(a.fondo) && a.tna > 0)
      .map((a) => mapApiAccountToAccountItem(a))
      .sort((a, b) => b.tna - a.tna)
  }

  const accounts = computed<AccountItem[]>((): AccountItem[] => {
    const apiData = data.value ?? []
    const frascosRaw = apiData.filter(
      (a) => isFrascosFondo(a.fondo) && !isBlacklisted(a.fondo) && a.tna > 0,
    )
    const frascosItem = buildFrascosAccountItem(frascosRaw)

    const base = filterAndMapAccounts([
      'CARREFOUR BANCO',
      'NARANJA X',
      'UALA',
      'BELO',
      'FIWIND',
      'BICA CUENTA POSITIVA 1',
      'BICA CUENTA POSITIVA 2',
      'BICA CUENTA POSITIVA 3',
      'BICA CUENTA POSITIVA 4',
      'VOII',
    ])

    const result = frascosItem ? [...base, frascosItem] : base
    return result.sort((a, b) => b.tna - a.tna)
  })

  const specialAccounts = computed<AccountItem[]>((): AccountItem[] => {
    return filterAndMapAccounts([
      'CRESIUM',
      'SUPERVIELLE',
      'UALA PLUS',
      'UALA PLUS 1',
      'UALA PLUS 2',
      'BNA',
      'SUPERVIELLE HIT IOL',
    ])
  })

  return { accounts, specialAccounts, loading, error, fetch }
}
