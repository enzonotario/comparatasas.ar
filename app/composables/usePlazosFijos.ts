import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { PlazoFijo } from '../types/investments'

const data = ref<PlazoFijo[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function usePlazosFijos() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<PlazoFijo[]>(
        'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const plazosFijosItems = computed(() => {
    return (data.value ?? [])
      .map((plazoFijo) => ({
        ...plazoFijo,
        tna: plazoFijo.tnaClientes || plazoFijo.tnaNoClientes || 0,
      }))
      .sort((a, b) => b.tna - a.tna)
      .map((plazoFijo) => ({
        logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo,
        institution: getPlazoFijoShortName(plazoFijo.entidad),
        tna: plazoFijo.tna * 100,
        url: getPlazoFijoUrl(plazoFijo.entidad) || plazoFijo.enlace || '#',
        type: 'plazoFijo30d',
        typeLabel: 'Plazo Fijo 30 días',
      }))
      .filter((item) => item.tna > 0)
  })

  return {
    plazosFijos: data,
    plazosFijosItems,
    loading,
    error,
    fetch,
  }
}
