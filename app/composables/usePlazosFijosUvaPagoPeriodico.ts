import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { ProveedorPlazoFijoUvaPagoPeriodico } from '../types/investments'

export interface PlazoFijoUvaPagoPeriodicoItem {
  rowKey: string
  institution: string
  logo: string
  displayName: string
  tna: number
  url: string
  type: 'plazoFijoUvaPagoPeriodico'
  typeLabel: string
  plazoMinDias: number
  plazoMaxDias: number
}

const data = ref<ProveedorPlazoFijoUvaPagoPeriodico[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function usePlazosFijosUvaPagoPeriodico() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ProveedorPlazoFijoUvaPagoPeriodico[]>(
        'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijoUvaPagoPeriodico',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const items = computed((): PlazoFijoUvaPagoPeriodicoItem[] => {
    const rows: PlazoFijoUvaPagoPeriodicoItem[] = []

    for (const prov of data.value ?? []) {
      for (const t of prov.tasas) {
        rows.push({
          rowKey: `${prov.entidad} [${t.plazoMinDias}-${t.plazoMaxDias}]`,
          institution: getPlazoFijoShortName(prov.entidad) || prov.entidad,
          logo: getPlazoFijoLogo(prov.entidad) || prov.logo,
          displayName: `Plazo mínimo: ${t.plazoMinDias} días · Plazo máximo: ${t.plazoMaxDias} días`,
          tna: t.tna * 100,
          url: getPlazoFijoUrl(prov.entidad) || '#',
          type: 'plazoFijoUvaPagoPeriodico',
          typeLabel: 'PF UVA pago periódico',
          plazoMinDias: t.plazoMinDias,
          plazoMaxDias: t.plazoMaxDias,
        })
      }
    }

    return rows.sort((a, b) => b.tna - a.tna)
  })

  return {
    proveedores: data,
    plazosFijosUvaPagoPeriodicoItems: items,
    loading,
    error,
    fetch,
  }
}
