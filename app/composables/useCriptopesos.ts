import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'

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

const data = ref<ApiCriptopeso[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useCriptopesos() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ApiCriptopeso[]>(
        'https://api.argentinadatos.com/v1/finanzas/criptopesos/',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  function mapApiCriptopesoToItem(a: ApiCriptopeso): CriptopesoItem {
    return {
      fondo: getInstitutionShortName(a.entidad) || a.entidad,
      tna: a.tna,
      tea: 0,
      tope: null,
      logo: getInstitutionLogo(a.entidad),
      type: 'criptopeso',
      typeLabel: 'Criptopeso',
      url: getInstitutionUrl(a.entidad),
    }
  }

  const criptopesos = computed<CriptopesoItem[]>((): CriptopesoItem[] => {
    return (data.value ?? [])
      .map((a) => mapApiCriptopesoToItem(a))
      .sort((a, b) => b.tna - a.tna)
  })

  return { criptopesos, loading, error, fetch }
}

