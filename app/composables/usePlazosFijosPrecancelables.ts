import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { PlazoFijoPrecancelable } from '../types/investments'

export interface PlazoFijoPrecancelableItem {
  institution: string
  logo: string
  displayName: string
  tna: number
  tea: number | null
  tnaPrecancelacion: number | null
  teaPrecancelacion: number | null
  url: string
  type: 'plazoFijoPrecancelable'
  typeLabel: string
  plazoMinDias: number
  plazoMaxDias: number | null
  plazoPrecancelacionDias: number | null
  avisoPrecancelacionDias: number | null
  montoMinimo: number | null
  tope?: number | null
  canal: string | null
  modalidad: string | null
}

const data = ref<PlazoFijoPrecancelable[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

function formatPlazo(plazoMinDias: number, plazoMaxDias: number | null): string {
  if (plazoMaxDias == null) return `Plazo mínimo: ${plazoMinDias} días`
  return `Plazo: ${plazoMinDias} a ${plazoMaxDias} días`
}

export function usePlazosFijosPrecancelables() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<PlazoFijoPrecancelable[]>(
        'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijoPrecancelable',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const items = computed((): PlazoFijoPrecancelableItem[] => {
    return (data.value ?? [])
      .map((plazoFijo) => ({
        institution: getPlazoFijoShortName(plazoFijo.entidad) || plazoFijo.entidad,
        logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo,
        displayName: formatPlazo(plazoFijo.plazoMinDias, plazoFijo.plazoMaxDias),
        tna: (plazoFijo.tna ?? 0) * 100,
        tea: plazoFijo.tea == null ? null : plazoFijo.tea * 100,
        tnaPrecancelacion:
          plazoFijo.tnaPrecancelacion == null ? null : plazoFijo.tnaPrecancelacion * 100,
        teaPrecancelacion:
          plazoFijo.teaPrecancelacion == null ? null : plazoFijo.teaPrecancelacion * 100,
        url: plazoFijo.enlace || getPlazoFijoUrl(plazoFijo.entidad) || '#',
        type: 'plazoFijoPrecancelable' as const,
        typeLabel: 'PF UVA precancelable',
        plazoMinDias: plazoFijo.plazoMinDias,
        plazoMaxDias: plazoFijo.plazoMaxDias,
        plazoPrecancelacionDias: plazoFijo.plazoPrecancelacionDias,
        avisoPrecancelacionDias: plazoFijo.avisoPrecancelacionDias,
        montoMinimo: plazoFijo.montoMinimo,
        tope: plazoFijo.montoMaximo,
        canal: plazoFijo.canal,
        modalidad: plazoFijo.modalidad,
      }))
      .filter((item) => item.tna > 0 || (item.tnaPrecancelacion ?? 0) > 0)
      .sort((a, b) => {
        const precancelDiff = (b.tnaPrecancelacion ?? -1) - (a.tnaPrecancelacion ?? -1)
        if (precancelDiff !== 0) return precancelDiff
        return b.tna - a.tna
      })
  })

  return {
    plazosFijosPrecancelables: data,
    plazosFijosPrecancelablesItems: items,
    loading,
    error,
    fetch,
  }
}
