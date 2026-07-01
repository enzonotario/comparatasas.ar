import { toValue, type MaybeRefOrGetter } from 'vue'

export interface AccountHistoryItem {
  tna: number
  tea: number
  tope: number | null
  fecha: string
  condiciones: string | null
  condicionesCorto: string | null
}

export function getProviderApiName(displayName: string): string | null {
  const mapping: Record<string, string> = {
    Ualá: 'UALA',
    'Ualá Plus': 'UALA PLUS',
    'Ualá Plus 1': 'UALA PLUS 1',
    'Ualá Plus 2': 'UALA PLUS 2',
    'Banco BICA Cuenta Positiva 1': 'BICA CUENTA POSITIVA 1',
    'Banco BICA Cuenta Positiva 2': 'BICA CUENTA POSITIVA 2',
    'Banco BICA Cuenta Positiva 3': 'BICA CUENTA POSITIVA 3',
    'Banco BICA Cuenta Positiva 4': 'BICA CUENTA POSITIVA 4',
    Fiwind: 'FIWIND',
    Belo: 'BELO',
    'Carrefour Banco': 'CARREFOUR BANCO',
    'Naranja X': 'NARANJA X',
    Cresium: 'CRESIUM',
    Supervielle: 'SUPERVIELLE',
    'Supervielle Hit IOL': 'SUPERVIELLE HIT IOL',
    'Banco Nación': 'BNA',
    Brubank: 'BRUBANK',
    'Montemar Pay': 'MONTEMAR PAY',
  }

  return mapping[displayName] || null
}

/**
 * Verifica si un provider tiene historial disponible
 * Todos los providers de "Rendimiento garantizado" y "Con condiciones especiales" tienen historial
 */
export function hasHistory(displayName: string): boolean {
  return getProviderApiName(displayName) !== null
}

export function getProviderSlug(providerName: string): string {
  const normalized = providerName.trim().toUpperCase()

  const mapping: Record<string, string> = {
    UALA: 'uala',
    'UALA PLUS': 'uala-plus',
    'UALA PLUS 1': 'uala-plus-1',
    'UALA PLUS 2': 'uala-plus-2',
    'BICA CUENTA POSITIVA 1': 'bica-cuenta-positiva-1',
    'BICA CUENTA POSITIVA 2': 'bica-cuenta-positiva-2',
    'BICA CUENTA POSITIVA 3': 'bica-cuenta-positiva-3',
    'BICA CUENTA POSITIVA 4': 'bica-cuenta-positiva-4',
    FIWIND: 'fiwind',
    BELO: 'belo',
    'CARREFOUR BANCO': 'carrefour-banco',
    CARREFOUR: 'carrefour-banco',
    'NARANJA X': 'naranja-x',
    NARANJA: 'naranja-x',
    CRESIUM: 'cresium',
    SUPERVIELLE: 'supervielle',
    'SUPERVIELLE HIT IOL': 'supervielle-hit-iol',
    BNA: 'bna',
    'BANCO NACIÓN ARGENTINA': 'bna',
    'BANCO NACION': 'bna',
    'BANCO DE LA NACION ARGENTINA': 'bna',
    BRUBANK: 'brubank',
    'MONTEMAR PAY': 'montemar-pay',
    MONTEMAR: 'montemar-pay',
  }

  return mapping[normalized] || normalized.toLowerCase()
}

export const ACCOUNT_HISTORY_PROVIDER_SLUGS = [
  'uala',
  'uala-plus',
  'uala-plus-1',
  'uala-plus-2',
  'bica-cuenta-positiva-1',
  'bica-cuenta-positiva-2',
  'bica-cuenta-positiva-3',
  'bica-cuenta-positiva-4',
  'fiwind',
  'belo',
  'carrefour-banco',
  'naranja-x',
  'cresium',
  'supervielle',
  'supervielle-hit-iol',
  'bna',
  'brubank',
  'montemar-pay',
] as const

export function useAccountHistory(providerSlug: MaybeRefOrGetter<string>) {
  const slug = computed(() => toValue(providerSlug))

  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData(
    () => `account-history:${slug.value}`,
    async () => {
      try {
        const response = await $fetch<AccountHistoryItem[]>(
          `https://api.argentinadatos.com/v1/finanzas/fci/otros/${slug.value}/`,
        )
        return response.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      } catch {
        return []
      }
    },
    {
      watch: [slug],
    },
  )

  return { data, loading, error, fetch }
}
