import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { PlazoFijo } from '../types/investments'

export function usePlazosFijos() {
  const {
    data: plazosFijos,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('plazos-fijos', () =>
    $fetch<PlazoFijo[]>('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo'),
  )

  const plazosFijosItems = computed(() => {
    return (plazosFijos.value ?? [])
      .map((plazoFijo) => ({
        ...plazoFijo,
        tna: plazoFijo.tnaClientes || plazoFijo.tnaNoClientes || 0,
        fecha: plazoFijo.fecha,
      }))
      .sort((a, b) => b.tna - a.tna)
      .map((plazoFijo) => ({
        logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo,
        institution: getPlazoFijoShortName(plazoFijo.entidad),
        tna: plazoFijo.tna * 100,
        url: getPlazoFijoUrl(plazoFijo.entidad) || plazoFijo.enlace || '#',
        fecha: plazoFijo.fecha,
        fechaAnterior: plazoFijo.fechaAnterior,
        type: 'plazoFijo30d',
        typeLabel: 'Plazo Fijo 30 días',
      }))
      .filter((item) => item.tna > 0)
  })

  return {
    plazosFijos,
    plazosFijosItems,
    loading,
    error,
    fetch,
  }
}
