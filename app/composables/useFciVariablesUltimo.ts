import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { getLogoForEntity } from '~/lib/mappings/logos'
import { isBlacklisted } from '~/lib/blacklist'
import type { ProcessedFund } from '~/types/investments'

export interface FciVariableUltimoRow {
  nombre?: string
  fondo?: string
  tipo: string
  tna: number
  tea: number
  tope: number | null
  fecha: string
  condiciones?: string
  condicionesCorto?: string
}

export type FciVariableUltimoFund = ProcessedFund & {
  tope: number | null
  condiciones?: string
  condicionesCorto?: string
}

const data = ref<FciVariableUltimoRow[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

function variableEntityKey(row: FciVariableUltimoRow): string {
  return row.nombre?.trim() || row.fondo?.trim() || ''
}

function mapRow(row: FciVariableUltimoRow): FciVariableUltimoFund {
  const rawEntity = variableEntityKey(row)
  const label = getInstitutionShortName(rawEntity) || rawEntity
  const fundName = row.fondo?.trim()
  const displayName =
    row.nombre?.trim() && fundName && fundName.toUpperCase() !== rawEntity.toUpperCase()
      ? `${label} · ${fundName}`
      : label
  return {
    fondo: displayName,
    institution: label,
    tna: row.tna,
    tea: row.tea,
    fecha: row.fecha,
    logo: getLogoForEntity(label) || getLogoForEntity(rawEntity) || getInstitutionLogo(rawEntity),
    url: getInstitutionUrl(rawEntity),
    type: 'fciVariablesUltimo',
    typeLabel: row.tipo === 'billetera' ? 'Billetera' : 'Renta variable',
    tope: row.tope,
    condiciones: row.condiciones,
    condicionesCorto: row.condicionesCorto,
    meta: {
      showInFunds: false,
      showInAccounts: true,
    },
  }
}

export function useFciVariablesUltimo() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<FciVariableUltimoRow[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/variables/ultimo',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const funds = computed<FciVariableUltimoFund[]>(() => {
    return (data.value ?? [])
      .filter((row) => {
        const key = variableEntityKey(row)
        return key && !isBlacklisted(key)
      })
      .map(mapRow)
      .sort((a, b) => b.tna - a.tna)
  })

  return { funds, loading, error, fetch }
}
