import {
  simulateComisionCobro,
  type ComisionCobroSimResult,
} from '~/lib/finance/comision-cobro'
import type { ComisionCobroOption } from '~/composables/useComisionesCobro'

export type ComisionCobroSimulada<T extends ComisionCobroOption = ComisionCobroOption> = T & {
  simulationDisabled: boolean
  simulation: ComisionCobroSimResult | null
}

export function useComisionesCobroSimulator() {
  const amount = useState('comisiones-cobro-simulator-amount', () => 100_000)
  const sumarIva = useState('comisiones-cobro-simulator-sumar-iva', () => true)
  const isOpen = useState('comisiones-cobro-simulator-isOpen', () => false)
  const isSimulating = useState('comisiones-cobro-simulator-isSimulating', () => false)

  function openSimulator() {
    isOpen.value = true
    isSimulating.value = true
  }

  function minimizeSimulator() {
    isOpen.value = false
  }

  function closeSimulator() {
    isOpen.value = false
    isSimulating.value = false
  }

  function calculateResults<T extends ComisionCobroOption>(
    itemsRef: Ref<T[]> | ComputedRef<T[]>,
  ) {
    return computed<ComisionCobroSimulada<T>[]>(() => {
      return unref(itemsRef).map((item) => {
        const simulation = simulateComisionCobro({
          monto: amount.value,
          arancel: item.arancel,
          ivaAdicional: item.ivaAdicional,
          sumarIva: sumarIva.value,
        })

        return {
          ...item,
          simulationDisabled: simulation == null,
          simulation,
        }
      })
    })
  }

  return {
    amount,
    sumarIva,
    isOpen,
    isSimulating,
    openSimulator,
    minimizeSimulator,
    closeSimulator,
    calculateResults,
  }
}
