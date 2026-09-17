import { useRouteQuery } from '@vueuse/router'
import type { PrestamoPersonal } from '~/composables/usePrestamosPersonales'
import {
  simulatePrestamoPersonal,
  type AumentoSalarialFrecuencia,
  type SimulatePrestamoPersonalResult,
} from '~/lib/finance/prestamo-personal'

export type PrestamosClienteFilter = 'todas' | 'sin_cliente' | 'cliente'

export type PrestamoPersonalSimulado = PrestamoPersonal & {
  simulation: SimulatePrestamoPersonalResult
}

export function prestamoPersonalOfertaKey(
  item: Pick<PrestamoPersonal, 'entidad' | 'producto' | 'condiciones'>,
): string {
  return [item.entidad, item.producto, item.condiciones ?? ''].join('::')
}

function parsePositiveNumber(value: string | number | null | undefined, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function parseOptionalPositiveNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function usePrestamosPersonalesSimulator(
  prestamos: Ref<PrestamoPersonal[]> | ComputedRef<PrestamoPersonal[]>,
) {
  const simQuery = useRouteQuery<string | undefined>('sim', undefined)
  const montoQuery = useRouteQuery<string | undefined>('monto', undefined)
  const plazoQuery = useRouteQuery<string | undefined>('plazo', undefined)
  const ingresosQuery = useRouteQuery<string | undefined>('ingresos', undefined)
  const aumentoQuery = useRouteQuery<string | undefined>('aumento', undefined)
  const frecuenciaQuery = useRouteQuery<string | undefined>('frecuencia', undefined)
  const estresQuery = useRouteQuery<string | undefined>('estres', undefined)
  const clienteQuery = useRouteQuery<string | undefined>('cliente', undefined)
  const condQuery = useRouteQuery<string | undefined>('cond', undefined)
  const ofertaQuery = useRouteQuery<string | undefined>('oferta', undefined)

  const isSimulating = computed({
    get: () => simQuery.value === '1',
    set: (value: boolean) => {
      simQuery.value = value ? '1' : undefined
    },
  })

  const isOpen = useState('prestamos-personales-simulator-open', () => false)

  function openSimulator() {
    isSimulating.value = true
    isOpen.value = true
  }

  function minimizeSimulator() {
    isOpen.value = false
  }

  function closeSimulator() {
    isOpen.value = false
    simQuery.value = undefined
    montoQuery.value = undefined
    plazoQuery.value = undefined
    ingresosQuery.value = undefined
    aumentoQuery.value = undefined
    frecuenciaQuery.value = undefined
    estresQuery.value = undefined
    clienteQuery.value = undefined
    condQuery.value = undefined
    ofertaQuery.value = undefined
  }

  const monto = computed({
    get: () => parsePositiveNumber(montoQuery.value, 1_000_000),
    set: (value: number) => {
      montoQuery.value = String(Math.round(parsePositiveNumber(value, 1_000_000)))
    },
  })

  const plazo = computed({
    get: () => {
      const months = Math.round(parsePositiveNumber(plazoQuery.value, 24))
      return Math.min(84, Math.max(1, months))
    },
    set: (value: number) => {
      const months = Math.min(84, Math.max(1, Math.round(parsePositiveNumber(value, 24))))
      plazoQuery.value = String(months)
    },
  })

  const ingresos = computed({
    get: () => parseOptionalPositiveNumber(ingresosQuery.value),
    set: (value: number | null) => {
      if (value == null || !Number.isFinite(value) || value <= 0) {
        ingresosQuery.value = undefined
        return
      }
      ingresosQuery.value = String(Math.round(value))
    },
  })

  const aumentoSalarial = computed({
    get: () => {
      const n = parseOptionalPositiveNumber(aumentoQuery.value)
      return n ?? 25
    },
    set: (value: number) => {
      const n = Math.min(200, Math.max(0, Number.isFinite(value) ? value : 25))
      aumentoQuery.value = String(n)
    },
  })

  const frecuenciaAumento = computed({
    get: (): AumentoSalarialFrecuencia => {
      const value = frecuenciaQuery.value
      if (value === 'semestral' || value === 'trimestral') return value
      return 'anual'
    },
    set: (value: AumentoSalarialFrecuencia) => {
      frecuenciaQuery.value = value === 'anual' ? undefined : value
    },
  })

  const sinAumento = computed({
    get: () => estresQuery.value === '1',
    set: (value: boolean) => {
      estresQuery.value = value ? '1' : undefined
    },
  })

  const clienteFilter = computed({
    get: (): PrestamosClienteFilter => {
      const value = clienteQuery.value
      if (value === 'sin_cliente' || value === 'cliente') return value
      return 'todas'
    },
    set: (value: PrestamosClienteFilter) => {
      clienteQuery.value = value === 'todas' ? undefined : value
    },
  })

  const condicionesSeleccionadas = computed({
    get: (): string[] => {
      const raw = String(condQuery.value ?? '').trim()
      if (!raw) return []
      return raw
        .split('|')
        .map((item) => decodeURIComponent(item.trim()))
        .filter(Boolean)
    },
    set: (values: string[]) => {
      const unique = [...new Set(values.map((v) => v.trim()).filter(Boolean))]
      condQuery.value = unique.length
        ? unique.map((v) => encodeURIComponent(v)).join('|')
        : undefined
    },
  })

  const condicionesDisponibles = computed(() => {
    const set = new Set<string>()
    for (const item of unref(prestamos)) {
      if (item.condiciones?.trim()) set.add(item.condiciones.trim())
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  })

  const prestamosFiltrados = computed(() => {
    return unref(prestamos).filter((item) => {
      if (clienteFilter.value === 'sin_cliente' && item.requiereCliente === true) return false
      if (clienteFilter.value === 'cliente' && item.requiereCliente === false) return false

      if (condicionesSeleccionadas.value.length > 0) {
        const cond = item.condiciones?.trim()
        if (!cond || !condicionesSeleccionadas.value.includes(cond)) return false
      }

      return true
    })
  })

  const prestamosSimulados = computed<PrestamoPersonalSimulado[]>(() => {
    const amount = monto.value
    const months = plazo.value
    const income = ingresos.value

    return prestamosFiltrados.value
      .map((item) => {
        const plazoMesesEjemplo =
          typeof item.metadata?.plazoMesesEjemplo === 'number'
            ? item.metadata.plazoMesesEjemplo
            : null

        const simulation = simulatePrestamoPersonal({
          amount,
          months,
          tnaPercent: item.tna,
          cftTeaPercent: item.cftTea,
          afectacionIngresos: item.metadata?.afectacionIngresos,
          income,
          plazoMesesEjemplo,
          tasasPorPlazo: item.metadata?.tasasPorPlazo,
        })

        return {
          ...item,
          simulation,
        }
      })
      .sort((a, b) => {
        const ka = a.simulation.cuotaCft ?? a.simulation.cuota ?? Number.POSITIVE_INFINITY
        const kb = b.simulation.cuotaCft ?? b.simulation.cuota ?? Number.POSITIVE_INFINITY
        if (ka !== kb) return ka - kb
        const ca = a.cftTea ?? a.tna ?? Number.POSITIVE_INFINITY
        const cb = b.cftTea ?? b.tna ?? Number.POSITIVE_INFINITY
        return ca - cb
      })
  })

  const mejorOferta = computed(() => {
    return (
      prestamosSimulados.value.find(
        (item) => !item.simulation.plazoFueraDeRango && item.simulation.cuota != null,
      ) ?? null
    )
  })

  const ofertaSeleccionadaKey = computed({
    get: () => ofertaQuery.value ?? null,
    set: (value: string | null) => {
      ofertaQuery.value = value || undefined
    },
  })

  const ofertaSeleccionada = computed(() => {
    const key = ofertaSeleccionadaKey.value
    if (key) {
      const found = prestamosSimulados.value.find((item) => prestamoPersonalOfertaKey(item) === key)
      if (found) return found
    }
    return mejorOferta.value
  })

  const activeOfertaKey = computed(() =>
    ofertaSeleccionada.value ? prestamoPersonalOfertaKey(ofertaSeleccionada.value) : null,
  )

  function selectOferta(item: PrestamoPersonal | PrestamoPersonalSimulado) {
    ofertaSeleccionadaKey.value = prestamoPersonalOfertaKey(item)
  }

  const prestamosParaLista = computed(() => {
    if (isSimulating.value) return prestamosSimulados.value
    return unref(prestamos)
  })

  return {
    monto,
    plazo,
    ingresos,
    aumentoSalarial,
    frecuenciaAumento,
    sinAumento,
    clienteFilter,
    condicionesSeleccionadas,
    condicionesDisponibles,
    prestamosFiltrados,
    prestamosSimulados,
    mejorOferta,
    ofertaSeleccionada,
    ofertaSeleccionadaKey,
    activeOfertaKey,
    selectOferta,
    prestamosParaLista,
    isSimulating,
    isOpen,
    openSimulator,
    minimizeSimulator,
    closeSimulator,
  }
}
