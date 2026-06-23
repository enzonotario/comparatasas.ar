import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { PlazoFijo, PlazoFijoItem, TasaPlazoFijo } from '../types/investments'

function formatMontoCompact(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatMontoRange(montoMinimo: number | null, montoMaximo: number | null): string {
  if (montoMinimo == null && montoMaximo == null) return ''
  if (montoMinimo == null && montoMaximo != null) return `Hasta ${formatMontoCompact(montoMaximo)}`
  if (montoMinimo != null && montoMaximo == null) return `Desde ${formatMontoCompact(montoMinimo)}`
  return `${formatMontoCompact(montoMinimo)}-${formatMontoCompact(montoMaximo)}`
}

function formatPlazoRange(plazoMinDias: number, plazoMaxDias: number | null): string {
  if (plazoMaxDias == null) return `desde ${plazoMinDias} días`
  if (plazoMinDias === plazoMaxDias) return `${plazoMinDias} días`
  return `${plazoMinDias}-${plazoMaxDias} días`
}

function buildTierRowKey(entidad: string, index: number): string {
  return `${entidad}#${index}`
}

function buildTierDisplayName(tasa: TasaPlazoFijo): string {
  const parts = [formatMontoRange(tasa.montoMinimo, tasa.montoMaximo)]
    .concat(formatPlazoRange(tasa.plazoMinDias, tasa.plazoMaxDias))
    .filter(Boolean)
  return parts.join(' · ')
}

function mapTierToItem(plazoFijo: PlazoFijo, tasa: TasaPlazoFijo, index: number): PlazoFijoItem {
  const institution = getPlazoFijoShortName(plazoFijo.entidad)
  const displayName = buildTierDisplayName(tasa)
  const hasMultipleTiers = (plazoFijo.tasas?.length ?? 0) > 1
  const providerCondiciones =
    plazoFijo.condicionesCorto && plazoFijo.condicionesCorto !== 'null'
      ? plazoFijo.condicionesCorto
      : undefined

  return {
    rowKey: buildTierRowKey(plazoFijo.entidad, index),
    logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo || '',
    institution,
    tna: tasa.tna * 100,
    url: plazoFijo.enlace || getPlazoFijoUrl(plazoFijo.entidad) || '#',
    fecha: plazoFijo.fecha,
    fechaAnterior: plazoFijo.fechaAnterior,
    type: 'plazoFijo30d',
    typeLabel: 'Plazo Fijo 30 días',
    displayName,
    condicionesCorto: hasMultipleTiers ? undefined : providerCondiciones,
    plazoMinDias: tasa.plazoMinDias,
    plazoMaxDias: tasa.plazoMaxDias,
    montoMinimo: tasa.montoMinimo,
    montoMaximo: tasa.montoMaximo,
    tieredRate: true,
  }
}

function mapLegacyToItem(plazoFijo: PlazoFijo): PlazoFijoItem | null {
  const tna = plazoFijo.tnaClientes || plazoFijo.tnaNoClientes || 0
  if (tna <= 0) return null

  const institution = getPlazoFijoShortName(plazoFijo.entidad)

  return {
    rowKey: plazoFijo.entidad,
    logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo || '',
    institution,
    tna: tna * 100,
    url: plazoFijo.enlace || getPlazoFijoUrl(plazoFijo.entidad) || '#',
    fecha: plazoFijo.fecha,
    fechaAnterior: plazoFijo.fechaAnterior,
    type: 'plazoFijo30d',
    typeLabel: 'Plazo Fijo 30 días',
    condicionesCorto:
      plazoFijo.condicionesCorto && plazoFijo.condicionesCorto !== 'null'
        ? plazoFijo.condicionesCorto
        : undefined,
  }
}

export function usePlazosFijos() {
  const {
    data: plazosFijos,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('plazos-fijos', () =>
    $fetch<PlazoFijo[]>('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo'),
  )

  const plazosFijosItems = computed((): PlazoFijoItem[] => {
    const rows: PlazoFijoItem[] = []

    for (const plazoFijo of plazosFijos.value ?? []) {
      if (plazoFijo.tasas?.length) {
        for (const [index, tasa] of plazoFijo.tasas.entries()) {
          if (tasa.tna <= 0) continue
          rows.push(mapTierToItem(plazoFijo, tasa, index))
        }
        continue
      }

      const legacy = mapLegacyToItem(plazoFijo)
      if (legacy) rows.push(legacy)
    }

    return rows.sort((a, b) => b.tna - a.tna)
  })

  const plazosFijosChartItems = computed(() =>
    plazosFijosItems.value.map((item) => ({
      institution: item.displayName ? `${item.institution} · ${item.displayName}` : item.institution,
      tna: item.tna,
      logo: item.logo,
      typeLabel: item.typeLabel,
    })),
  )

  return {
    plazosFijos,
    plazosFijosItems,
    plazosFijosChartItems,
    loading,
    error,
    fetch,
  }
}
