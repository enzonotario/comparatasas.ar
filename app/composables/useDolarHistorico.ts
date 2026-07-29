/**
 * Casas expuestas en el selector (subset del OpenAPI
 * oficial | blue | bolsa | contadoconliqui | cripto | mayorista | solidario | turista).
 * Se omiten: mayorista, solidario, turista (404).
 */
export const DOLAR_CASAS = [
  { value: 'blue', label: 'Blue', shortLabel: 'blue' },
  { value: 'oficial', label: 'Oficial', shortLabel: 'oficial' },
  { value: 'bolsa', label: 'Bolsa (MEP)', shortLabel: 'MEP' },
  { value: 'contadoconliqui', label: 'Contado con liquidación', shortLabel: 'CCL' },
  { value: 'cripto', label: 'Cripto', shortLabel: 'cripto' },
] as const

export type DolarCasa = (typeof DOLAR_CASAS)[number]['value']

export const DEFAULT_DOLAR_CASA: DolarCasa = 'blue'

export function isDolarCasa(value: string): value is DolarCasa {
  return DOLAR_CASAS.some((casa) => casa.value === value)
}

export function getDolarCasaLabel(casa: DolarCasa): string {
  return DOLAR_CASAS.find((item) => item.value === casa)?.label ?? casa
}

export function getDolarCasaShortLabel(casa: DolarCasa): string {
  return DOLAR_CASAS.find((item) => item.value === casa)?.shortLabel ?? casa
}

export interface DolarHistoricoRow {
  casa: string
  compra: number | null
  venta: number | null
  fecha: string
}

export function useDolarHistorico(casa: Ref<DolarCasa> | ComputedRef<DolarCasa>) {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData(
    () => `dolar-historico-${casa.value}`,
    () =>
      $fetch<DolarHistoricoRow[]>(
        `https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa.value}`,
      ),
    { watch: [casa] },
  )

  const dolarHistorico = computed(() => {
    return (data.value ?? [])
      .filter((row) => row.venta != null && Number.isFinite(row.venta) && row.venta > 0)
      .map((row) => ({
        fecha: row.fecha,
        valor: row.venta as number,
      }))
  })

  return {
    dolarHistorico,
    loading,
    error,
    fetch,
  }
}
