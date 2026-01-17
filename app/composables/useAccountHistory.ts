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
    Fiwind: 'FIWIND',
    Belo: 'BELO',
    'Carrefour Banco': 'CARREFOUR BANCO',
    'Naranja X': 'NARANJA X',
    Cresium: 'CRESIUM',
    Supervielle: 'SUPERVIELLE',
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
    FIWIND: 'fiwind',
    BELO: 'belo',
    'CARREFOUR BANCO': 'carrefour-banco',
    CARREFOUR: 'carrefour-banco',
    'NARANJA X': 'naranja-x',
    NARANJA: 'naranja-x',
    CRESIUM: 'cresium',
    SUPERVIELLE: 'supervielle',
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

export function useAccountHistory() {
  const data = ref<AccountHistoryItem[] | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function fetch(providerSlug: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<AccountHistoryItem[]>(
        `https://api.argentinadatos.com/v1/finanzas/fci/otros/${providerSlug}/`,
      )
      // Ordenar por fecha de más antiguo a más reciente
      data.value = response.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      )
    } catch (err) {
      error.value = err
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetch }
}
