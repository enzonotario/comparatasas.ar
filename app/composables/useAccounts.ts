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
  fecha: string
  logo?: string
  condiciones?: string
  condicionesCorto?: string
  type?: string
  typeLabel?: string
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
    const today = new Date().toISOString().split('T')[0]
    return {
      fondo: getInstitutionShortName(a.fondo) || a.fondo,
      tna: a.tna,
      tea: 0,
      tope: a.tope,
      fecha: a.fecha || today,
      logo: getInstitutionLogo(a.fondo),
      type: a.fondo === 'FIWIND' ? 'billetera' : 'cuentaRemunerada',
      typeLabel: a.fondo === 'FIWIND' ? 'Billetera' : 'Cuenta Remunerada',
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
    return filterAndMapAccounts(['CARREFOUR BANCO', 'FIWIND', 'NARANJA X'])
  })

  const specialAccounts = computed<AccountItem[]>((): AccountItem[] => {
    return filterAndMapAccounts(['CRESIUM', 'SUPERVIELLE'])
  })

  return { accounts, specialAccounts, loading, error, fetch }
}
