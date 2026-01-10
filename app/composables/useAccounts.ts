import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'

export interface ApiAccount {
  fondo: string
  tna: number
  tope: number | null
  fecha?: string
  condiciones?: string
  condicionesCorto?: string
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
}

const data = ref<ApiAccount[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useAccounts() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ApiAccount[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  function mapApiAccountToAccountItem(a: ApiAccount): AccountItem {
    return {
      fondo: getInstitutionShortName(a.fondo) || a.fondo,
      tna: a.tna,
      tea: 0,
      tope: a.tope,
      fecha: a.fecha,
      logo: getInstitutionLogo(a.fondo),
      type: ['FIWIND', 'BELO'].includes(a.fondo) ? 'billetera' : 'cuentaRemunerada',
      typeLabel: ['FIWIND', 'BELO'].includes(a.fondo) ? 'Billetera' : 'Cuenta Remunerada',
      condiciones: a.condiciones,
      condicionesCorto: a.condicionesCorto,
      url: getInstitutionUrl(a.fondo),
    }
  }

  function filterAndMapAccounts(fundNames: string[]): AccountItem[] {
    return (data.value ?? [])
      .filter((a) => fundNames.includes(a.fondo))
      .map((a) => mapApiAccountToAccountItem(a))
      .sort((a, b) => b.tna - a.tna)
  }

  const accounts = computed<AccountItem[]>((): AccountItem[] => {
    return filterAndMapAccounts(['CARREFOUR BANCO', 'FIWIND', 'NARANJA X', 'UALA', 'BELO'])
  })

  const specialAccounts = computed<AccountItem[]>((): AccountItem[] => {
    return filterAndMapAccounts([
      'CRESIUM',
      'SUPERVIELLE',
      'UALA PLUS',
      'UALA PLUS 1',
      'UALA PLUS 2',
      'BNA',
    ])
  })

  return { accounts, specialAccounts, loading, error, fetch }
}
