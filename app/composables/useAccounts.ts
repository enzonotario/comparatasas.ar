import { getInstitutionLogo, getInstitutionShortName } from '~/lib/mappings/institutions'
import { getFundMapping } from '~/lib/mappings/funds'

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

  const accounts = computed<AccountItem[]>((): AccountItem[] => {
    const today = new Date().toISOString().split('T')[0]
    const apiItems = data.value ?? []
    return apiItems
      .filter((a) => ['FIWIND', 'NARANJA X', 'UALA'].includes(a.fondo))
      .map((a) => {
        return {
          fondo: getInstitutionShortName(a.fondo) || a.fondo,
          tna: a.tna,
          tea: 0,
          tope: a.tope,
          fecha: a.fecha || today,
          logo: getInstitutionLogo(a.fondo),
          type: a.fondo === 'FIWIND' ? 'billetera' : 'cuentaRemunerada',
          typeLabel: a.fondo === 'FIWIND' ? 'Billetera' : 'Cuenta Remunerada',
        } as AccountItem
      })
      .sort((a, b) => b.tna - a.tna)
  })

  const specialAccounts = computed<AccountItem[]>((): AccountItem[] => {
    const today = new Date().toISOString().split('T')[0]
    return (data.value ?? [])
      .filter((a) => ['UALA PLUS', 'SUPERVIELLE'].includes(a.fondo))
      .map(
        (a) =>
          ({
            fondo: getInstitutionShortName(a.fondo) || a.fondo,
            tna: a.tna,
            tea: 0,
            tope: a.tope,
            fecha: a.fecha || today,
            logo: getInstitutionLogo(a.fondo),
            type: 'cuentaRemunerada',
            typeLabel: 'Cuenta Remunerada',
            condiciones: a.condiciones,
            condicionesCorto: a.condicionesCorto,
          }) as AccountItem,
      )
      .sort((a, b) => b.tna - a.tna)
  })

  return { accounts, specialAccounts, loading, error, fetch }
}
