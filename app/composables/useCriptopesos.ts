import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { getLogoForEntity } from '~/lib/mappings/logos'
import { isBlacklisted } from '~/lib/blacklist'

export interface ApiCriptopeso {
  token: string
  entidad: string
  tna: number
}

export interface CriptopesoItem {
  fondo: string
  tna: number
  tea: number
  tope: number | null
  fecha?: string
  logo?: string
  type?: string
  typeLabel?: string
  url?: string
}

export function useCriptopesos() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('criptopesos', () =>
    $fetch<ApiCriptopeso[]>('https://api.argentinadatos.com/v1/finanzas/criptopesos/'),
  )

  function mapApiCriptopesoToItem(a: ApiCriptopeso): CriptopesoItem {
    return {
      fondo: getInstitutionShortName(a.entidad) || a.entidad,
      tna: a.tna,
      tea: 0,
      tope: null,
      logo: getLogoForEntity(a.entidad) || getInstitutionLogo(a.entidad),
      type: 'criptopeso',
      typeLabel: a.token,
      url: getInstitutionUrl(a.entidad),
    }
  }

  const criptopesos = computed<CriptopesoItem[]>((): CriptopesoItem[] => {
    return (data.value ?? [])
      .filter((a) => !isBlacklisted(a.entidad))
      .map((a) => mapApiCriptopesoToItem(a))
      .sort((a, b) => b.tna - a.tna)
  })

  return { criptopesos, loading, error, fetch }
}
