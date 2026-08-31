import { computed, onMounted, watch } from 'vue'
import { useRouteQuery } from '@vueuse/router'
import type { CaucionMoneda } from '~/composables/useCauciones'
import {
  filterComisionesCauciones,
  formatTasaPublicada,
  formatMembresiaMensual,
  getComisionBroker,
  type ComisionCaucionBrokerApi,
  type OperacionCaucionFilter,
} from '~/lib/finance/comision-caucion-broker'
import { getInstitutionShortName } from '~/lib/mappings/institutions'

export interface BrokerOption {
  label: string
  value: string
  /** Comisión / tasa publicada, visible al desplegar el select. */
  description: string
}

function formatBrokerComisionDescription(row: ComisionCaucionBrokerApi): string {
  const tasa = formatTasaPublicada(row)
  const partes: string[] = []
  if (tasa !== 'Consultar') {
    partes.push(row.ivaAdicional ? `${tasa} + IVA` : tasa)
  } else {
    partes.push(tasa)
  }
  const membresia = formatMembresiaMensual(row)
  if (membresia) partes.push(`membresía ${membresia}`)
  return partes.join(' · ')
}

export function useCaucionesBrokerSelection(
  moneda: MaybeRefOrGetter<CaucionMoneda>,
  operacion: MaybeRefOrGetter<OperacionCaucionFilter | 'compra' | 'venta'>,
  comisiones: MaybeRefOrGetter<ComisionCaucionBrokerApi[]>,
  producto: MaybeRefOrGetter<string> = 'cauciones',
) {
  const monedaRef = computed(() => toValue(moneda))
  const operacionRef = computed(() => toValue(operacion))
  const comisionesRef = computed(() => toValue(comisiones))
  const productoRef = computed(() => toValue(producto))

  const currencyCode = computed(() => (monedaRef.value === 'usd' ? 'USD' : 'ARS'))

  const brokerQuery = useRouteQuery<string>('broker', '')

  const brokerOptions = computed<BrokerOption[]>(() => {
    const rows = filterComisionesCauciones(comisionesRef.value, {
      moneda: currencyCode.value,
      operacion: operacionRef.value,
      producto: productoRef.value,
    })
    return rows.map((row) => ({
      value: row.entidad,
      label:
        getInstitutionShortName(row.entidad) ||
        getInstitutionShortName(row.nombreComercial) ||
        row.nombreComercial ||
        row.entidad,
      description: formatBrokerComisionDescription(row),
    }))
  })

  const selectedEntidad = computed({
    get: () => {
      const current = brokerQuery.value
      if (current && brokerOptions.value.some((option) => option.value === current)) {
        return current
      }
      return brokerOptions.value[0]?.value ?? ''
    },
    set: (value: string) => {
      brokerQuery.value = value
    },
  })

  const selectedComision = computed(() =>
    selectedEntidad.value
      ? getComisionBroker(
          comisionesRef.value,
          selectedEntidad.value,
          currencyCode.value,
          operacionRef.value,
          productoRef.value,
        )
      : null,
  )

  const selectedBrokerLabel = computed(
    () =>
      brokerOptions.value.find((option) => option.value === selectedEntidad.value)?.label ??
      selectedEntidad.value,
  )

  function pickRandomBroker() {
    const options = brokerOptions.value
    if (!options.length) return
    const idx = Math.floor(Math.random() * options.length)
    brokerQuery.value = options[idx]!.value
  }

  onMounted(() => {
    if (!brokerQuery.value) {
      pickRandomBroker()
    }
  })

  watch(brokerOptions, (options) => {
    if (!options.length) {
      brokerQuery.value = ''
      return
    }
    if (!options.some((option) => option.value === brokerQuery.value)) {
      pickRandomBroker()
    }
  })

  return {
    brokerOptions,
    selectedEntidad,
    selectedComision,
    selectedBrokerLabel,
  }
}
