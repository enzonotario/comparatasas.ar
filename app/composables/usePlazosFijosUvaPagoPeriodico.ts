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

export function usePlazosFijosUvaPagoPeriodico() {
  const {
    data: proveedores,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('plazos-fijos-uva-pago-periodico', () =>
    $fetch<ProveedorPlazoFijoUvaPagoPeriodico[]>(
      'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijoUvaPagoPeriodico',
    ),
  )

  const items = computed((): PlazoFijoUvaPagoPeriodicoItem[] => {
    const rows: PlazoFijoUvaPagoPeriodicoItem[] = []

    for (const prov of proveedores.value ?? []) {
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
    proveedores,
    plazosFijosUvaPagoPeriodicoItems: items,
    loading,
    error,
    fetch,
  }
}
