import {
  findMatchingTasa,
  getDisplayPlazoKey,
  getMaxTnaForPlazoKey,
  getRootTnaDecimal,
  groupRatesByPlazoKey,
  mergeRootTnaFor30d,
  STANDARD_PLAZO_COLUMNS,
} from '../lib/plazo-fijo-rates'
import {
  getPlazoFijoShortName,
  getPlazoFijoLogo,
  getPlazoFijoUrl,
} from '../lib/mappings/plazo-fijo'
import type { PlazoFijo, PlazoFijoTableRow } from '../types/investments'

function mapEntityToTableRow(plazoFijo: PlazoFijo): PlazoFijoTableRow | null {
  const institution = getPlazoFijoShortName(plazoFijo.entidad)
  const rootTnaDecimal = getRootTnaDecimal(plazoFijo)
  const hasTieredRates = (plazoFijo.tasas?.length ?? 0) > 0

  if (!hasTieredRates && rootTnaDecimal <= 0) return null

  const ratesByPlazo = mergeRootTnaFor30d(
    hasTieredRates ? groupRatesByPlazoKey(plazoFijo.tasas!) : {},
    rootTnaDecimal,
  )

  if (Object.keys(ratesByPlazo).length === 0) return null

  const sortTnaByPlazo = Object.fromEntries(
    STANDARD_PLAZO_COLUMNS.map((column) => [
      column.key,
      getMaxTnaForPlazoKey(ratesByPlazo, column.key),
    ]),
  )

  const sortTna = Math.max(
    ...Object.values(ratesByPlazo).flatMap((cells) => cells.map((cell) => cell.tna)),
    0,
  )

  return {
    rowKey: plazoFijo.entidad,
    institution,
    logo: getPlazoFijoLogo(plazoFijo.entidad) || plazoFijo.logo || '',
    url: plazoFijo.enlace || getPlazoFijoUrl(plazoFijo.entidad) || '#',
    fecha: plazoFijo.fecha,
    fechaAnterior: plazoFijo.fechaAnterior,
    condicionesCorto:
      plazoFijo.condicionesCorto && plazoFijo.condicionesCorto !== 'null'
        ? plazoFijo.condicionesCorto
        : undefined,
    tasas: plazoFijo.tasas,
    rootTna: rootTnaDecimal > 0 ? rootTnaDecimal * 100 : undefined,
    ratesByPlazo,
    sortTna,
    sortTnaByPlazo,
    sortTna30d: sortTnaByPlazo['30'] ?? 0,
  }
}

export function resolvePlazoFijoRateAtDays(
  row: PlazoFijoTableRow,
  days: number,
  amount?: number,
): { tna: number; plazoKey?: string } | null {
  if (amount != null) {
    const matchingTasa = findMatchingTasa(row.tasas, days, amount)
    if (matchingTasa) {
      return {
        tna: matchingTasa.tna * 100,
        plazoKey: getDisplayPlazoKey(matchingTasa) ?? undefined,
      }
    }
  }

  if (row.rootTna && row.rootTna > 0 && days >= 30 && days <= 44) {
    return { tna: row.rootTna, plazoKey: '30' }
  }

  const matchingTasa = findMatchingTasa(row.tasas, days, amount)
  if (matchingTasa) {
    return {
      tna: matchingTasa.tna * 100,
      plazoKey: getDisplayPlazoKey(matchingTasa) ?? undefined,
    }
  }

  return null
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

  const plazosFijosTableRows = computed((): PlazoFijoTableRow[] => {
    return (plazosFijos.value ?? [])
      .map(mapEntityToTableRow)
      .filter((row): row is PlazoFijoTableRow => row != null)
      .sort((a, b) => b.sortTna30d - a.sortTna30d || b.sortTna - a.sortTna)
  })

  const plazosFijosPlazoColumns = computed(() => STANDARD_PLAZO_COLUMNS)

  const plazosFijosChartItems = computed(() =>
    plazosFijosTableRows.value.map((item) => ({
      institution: item.institution,
      tna: item.sortTna,
      logo: item.logo,
      typeLabel: 'Plazo fijo tradicional',
    })),
  )

  function chartItemsForDays(days: number) {
    return plazosFijosTableRows.value
      .map((row) => {
        const match = resolvePlazoFijoRateAtDays(row, days)
        if (!match) return null
        return {
          institution: row.institution,
          tna: match.tna,
          logo: row.logo,
          typeLabel: `Plazo fijo · ${days} días`,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item != null)
      .sort((a, b) => b.tna - a.tna)
  }

  return {
    plazosFijos,
    plazosFijosTableRows,
    plazosFijosPlazoColumns,
    plazosFijosChartItems,
    chartItemsForDays,
    loading,
    error,
    fetch,
  }
}
