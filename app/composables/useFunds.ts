import { getFundMapping, type FundInstitution } from '../lib/mappings/funds'
import { getInstitutionLogo, getInstitutionUrl } from '../lib/mappings/institutions'
import type { ProcessedFund } from '../types/investments'

interface FundRaw {
  fondo: string
  horizonte: string
  fecha: string
  vcp: number
  ccp: number
  patrimonio: number
}

interface Funds {
  rentaFija: ProcessedFund[]
  mercadoDinero: ProcessedFund[]
  rentaMixta: ProcessedFund[]
  rentaVariable: ProcessedFund[]
}

const data: Ref<Funds> = ref({
  rentaFija: [],
  mercadoDinero: [],
  rentaMixta: [],
  rentaVariable: [],
})

const allFundsCache: Ref<ProcessedFund[]> = ref([])
const loading = ref(true)
const error = ref<unknown>(null)

function calculateReturns(newerVCP: number, olderVCP: number, daysBetween: number) {
  if (daysBetween <= 0 || olderVCP <= 0) return { tna: 0, tea: 0 }
  const totalReturn = (newerVCP - olderVCP) / olderVCP
  const dailyReturn = totalReturn / daysBetween
  const annualizedReturn = Math.pow(1 + dailyReturn, 365) - 1
  const tna = dailyReturn * 365
  const tea = annualizedReturn
  return { tna, tea }
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return Math.abs(Math.round((+d1 - +d2) / (1000 * 60 * 60 * 24)))
}

function getFundsMap(latest: FundRaw[], previous: FundRaw[]) {
  return latest.flatMap((l) => {
    const p = previous!.find((x) => x.fondo === l.fondo)
    if (!p) return []

    const newerDate = new Date(l.fecha) > new Date(p.fecha) ? l.fecha : p.fecha
    const newerVCP = new Date(l.fecha) > new Date(p.fecha) ? l.vcp : p.vcp
    const olderVCP = new Date(l.fecha) > new Date(p.fecha) ? p.vcp : l.vcp
    const d = daysBetween(l.fecha, p.fecha)
    const { tna, tea } = calculateReturns(newerVCP, olderVCP, d)

    const mapping = getFundMapping(l.fondo)
    if (!mapping) return []

    return (mapping.institutions as FundInstitution[]).map((inst: FundInstitution) => ({
      fondo: l.fondo,
      institution: inst.institution,
      displayName: inst.displayName,
      tna,
      tea,
      fecha: newerDate,
      patrimonio: l.patrimonio,
      logo: getInstitutionLogo(inst.institution),
      url: getInstitutionUrl(inst.institution),
      type: inst.showInUsdMoneyMarket
        ? 'mercadoDineroUsd'
        : inst.showInUsdFunds
          ? 'rentaFijaUsd'
          : undefined,
      typeLabel: inst.showInUsdMoneyMarket
        ? 'Money Market USD'
        : inst.showInUsdFunds
          ? 'Renta Fija USD'
          : undefined,
      meta: {
        showInFunds: inst.showInFunds || false,
        showInAccounts: inst.showInAccounts || false,
        showInUsdFunds: inst.showInUsdFunds || false,
        showInStockFunds: inst.showInStockFunds || false,
        showInUsdMoneyMarket: inst.showInUsdMoneyMarket || false,
      },
    }))
  })
}

async function getLatestAndPreviousFundData() {
  const rentaFijaResponses = await getRentaFija()
  const mercadoDineroResponses = await getMercadoDinero()
  const rentaMixtaResponses = await getRentaMixta()
  const rentaVariableResponses = await getRentaVariable()

  allFundsCache.value = [
    ...rentaFijaResponses,
    ...mercadoDineroResponses,
    ...rentaMixtaResponses,
    ...rentaVariableResponses,
  ]

  return {
    rentaFija: rentaFijaResponses,
    mercadoDinero: mercadoDineroResponses,
    rentaMixta: rentaMixtaResponses,
    rentaVariable: rentaVariableResponses,
  }
}

async function getMercadoDinero() {
  const { latest, previous } = await getLatestAndPreviousMercadoDinero()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'mercadoDinero',
      typeLabel: fund.typeLabel ?? 'Money Market',
    }))
}

async function getLatestAndPreviousMercadoDinero() {
  const latest = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo',
  )

  const previous = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/penultimo',
  )

  return { latest, previous }
}

async function getRentaMixta() {
  const { latest, previous } = await getLatestAndPreviousRentaMixta()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaMixta',
      typeLabel: fund.typeLabel ?? 'Renta Mixta',
    }))
}

async function getLatestAndPreviousRentaMixta() {
  const latest = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/ultimo',
  )

  const previous = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/penultimo',
  )

  return { latest, previous }
}

async function getRentaVariable() {
  const { latest, previous } = await getLatestAndPreviousRentaVariable()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaVariable',
      typeLabel: fund.typeLabel ?? 'Renta Variable',
    }))
}

async function getLatestAndPreviousRentaVariable() {
  const latest = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/ultimo',
  )

  const previous = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/penultimo',
  )

  return { latest, previous }
}

async function getRentaFija() {
  const { latest, previous } = await getLatestAndPreviousRentaFija()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaFija',
      typeLabel: fund.typeLabel ?? 'Renta Fija',
    }))
}

async function getRentaFijaPreviousData(targetDate: Date): Promise<FundRaw[]> {
  const targetDateString = targetDate.toISOString().split('T')[0].replace(/-/g, '/')

  try {
    const response = await $fetch<FundRaw[]>(
      `https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/${targetDateString}`,
    )

    if (!response || response.length === 0) {
      throw new Error(`No data for date ${targetDateString}`)
    }

    return response
  } catch {
    return await getRentaFijaPreviousData(new Date(targetDate.setDate(targetDate.getDate() - 1)))
  }
}

async function getLatestAndPreviousRentaFija() {
  const latest = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/ultimo',
  )

  const responses: Record<string, FundRaw[]> = {}

  const previous: FundRaw[] = []

  for (const fund of latest) {
    if (!fund.fecha) continue

    const today = new Date()
    const daysDiff = daysBetween(fund.fecha, today.toISOString().split('T')[0])
    if (daysDiff > 30) continue

    const fundName = fund.fondo
    const targetDate = new Date(fund.fecha)
    targetDate.setDate(targetDate.getDate() - 30)
    const targetDateString = targetDate.toISOString().split('T')[0].replace(/-/g, '/')

    let fundPrevious = responses[targetDateString]
    if (!fundPrevious) {
      try {
        fundPrevious = await getRentaFijaPreviousData(targetDate)
        responses[targetDateString] = fundPrevious
      } catch (e) {
        console.warn(`No data for date ${targetDateString}`, fund.fondo, e)
        fundPrevious = []
        responses[targetDateString] = fundPrevious
      }
    }

    if (fundPrevious && fundPrevious.length > 0) {
      // find the closest date before or equal to target date
      const sortedPrevious = fundPrevious
        .filter((f) => f.fondo === fundName && f.fecha && new Date(f.fecha) <= targetDate)
        .sort((a, b) => new Date(b.fecha!).getTime() - new Date(a.fecha!).getTime())

      if (sortedPrevious.length > 0) {
        previous.push(sortedPrevious[0])
      }
    }
  }

  return { latest, previous }
}

export function useFunds() {
  async function fetch() {
    if (
      data.value.rentaFija.length > 0 ||
      data.value.mercadoDinero.length > 0 ||
      data.value.rentaMixta.length > 0 ||
      data.value.rentaVariable.length > 0
    ) {
      return data.value // Return cached data if available
    }

    loading.value = true

    data.value = await getLatestAndPreviousFundData()

    loading.value = false

    return data.value
  }

  return { data, allFundsCache, loading, error, fetch }
}
