import { getPlazoFijoShortName } from '../lib/mappings/plazo-fijo'

export interface OgTopItem {
  name: string
  rate: string
}

const ACCOUNT_NAMES = ['CARREFOUR BANCO', 'FIWIND', 'NARANJA X', 'UALA', 'BELO']
const ACCOUNT_BLACKLIST = ['belo']

function isBlacklisted(name: string): boolean {
  return ACCOUNT_BLACKLIST.some((b) => b.toLowerCase() === name.toLowerCase())
}

export function formatTna(pct: number): string {
  return `${pct}% TNA`
}

export function formatApy(pct: number): string {
  return `${pct.toFixed(1)}% APY`
}

export function calcFundTna(newerVcp: number, olderVcp: number, days: number): number {
  if (days <= 0 || olderVcp <= 0) return 0
  return ((newerVcp - olderVcp) / olderVcp / days) * 365
}

export function top3Accounts(data: Array<{ fondo: string; tna: number }>): OgTopItem[] {
  return data
    .filter((a) => ACCOUNT_NAMES.includes(a.fondo) && !isBlacklisted(a.fondo))
    .sort((a, b) => b.tna - a.tna)
    .slice(0, 3)
    .map((a) => ({ name: a.fondo, rate: formatTna(a.tna * 100) }))
}

export function top3PlazosFijos(
  data: Array<{ entidad: string; tnaClientes: number }>,
): OgTopItem[] {
  return data
    .filter((a) => a.tnaClientes > 0)
    .sort((a, b) => b.tnaClientes - a.tnaClientes)
    .slice(0, 3)
    .map((a) => ({
      name: getPlazoFijoShortName(a.entidad),
      rate: formatTna(a.tnaClientes * 100),
    }))
}

/** Fondos procesados como en la sección Rendimiento variable de cuentas-billeteras */
export interface ProcessedFundForOg {
  fondo: string
  displayName?: string
  tna: number
  meta?: { showInAccounts?: boolean; showInFunds?: boolean }
}

/**
 * Top 3 fondos a partir de la misma lista que la sección "Rendimiento variable"
 * en cuentas-billeteras (resolvedFundsAccounts: showInAccounts + showInFunds).
 */
export function top3Funds(funds: ProcessedFundForOg[]): OgTopItem[] {
  return funds
    .sort((a, b) => b.tna - a.tna)
    .slice(0, 3)
    .map((f) => ({
      name: f.displayName ?? f.fondo,
      rate: formatTna((f.tna * 100).toFixed(2)),
    }))
}

export function top3Crypto(
  data: Array<{ entidad: string; rendimientos: Array<{ moneda: string; apy: number }> }>,
): OgTopItem[] {
  return data
    .map((entity) => ({
      name: entity.entidad,
      maxApy: Math.max(0, ...entity.rendimientos.map((r) => r.apy)),
    }))
    .filter((e) => e.maxApy > 0)
    .sort((a, b) => b.maxApy - a.maxApy)
    .slice(0, 3)
    .map((e) => ({ name: e.name, rate: formatApy(e.maxApy) }))
}

export function top3Hipotecarios(
  data: Array<{ nombreComercial: string; tna: number }>,
): OgTopItem[] {
  return data
    .sort((a, b) => a.tna - b.tna)
    .slice(0, 3)
    .map((a) => ({ name: a.nombreComercial, rate: formatTna(a.tna) }))
}
