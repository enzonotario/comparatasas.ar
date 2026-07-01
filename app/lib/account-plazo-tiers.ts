export interface AccountPlazoTier {
  plazoMinDias: number
  plazoMaxDias: number
  tna: number
  tea: number
}

export interface AccountPlazoTierSource {
  fondo: string
  tna: number
  tea?: number
  plazoMinDias?: number | null
  plazoMaxDias?: number | null
}

const FRASCOS_PREFIX = 'NARANJA X FRASCOS'

export function isFrascosFondo(fondo: string): boolean {
  return fondo.trim().toUpperCase().startsWith(FRASCOS_PREFIX)
}

export function extractFrascosTiers(accounts: AccountPlazoTierSource[]): AccountPlazoTier[] {
  return accounts
    .filter(
      (a) =>
        isFrascosFondo(a.fondo) && a.tna > 0 && a.plazoMinDias != null && a.plazoMaxDias != null,
    )
    .map((a) => ({
      plazoMinDias: a.plazoMinDias!,
      plazoMaxDias: a.plazoMaxDias!,
      tna: a.tna,
      tea: a.tea ?? 0,
    }))
    .sort((a, b) => a.plazoMinDias - b.plazoMinDias || a.plazoMaxDias - b.plazoMaxDias)
}

export function findAccountPlazoTier(
  tiers: AccountPlazoTier[],
  days: number,
): AccountPlazoTier | null {
  return tiers.find((t) => days >= t.plazoMinDias && days <= t.plazoMaxDias) ?? null
}

export function getPlazoTierBounds(tiers: AccountPlazoTier[]): {
  minDias: number
  maxDias: number
} {
  return {
    minDias: Math.min(...tiers.map((t) => t.plazoMinDias)),
    maxDias: Math.max(...tiers.map((t) => t.plazoMaxDias)),
  }
}

export function formatPlazoTierRange(tiers: AccountPlazoTier[]): string {
  const { minDias, maxDias } = getPlazoTierBounds(tiers)
  return `${minDias}–${maxDias} días`
}

export function formatPlazoTierTnaRange(tiers: AccountPlazoTier[], asDecimal = true): string {
  const values = [...new Set(tiers.map((t) => t.tna))].sort((a, b) => a - b)
  const fmt = (n: number) => {
    const pct = asDecimal ? n * 100 : n
    return `${pct.toFixed(2)}%`
  }
  if (values.length === 1) return fmt(values[0]!)
  return `${fmt(values[0]!)} – ${fmt(values[values.length - 1]!)}`
}

export function isDayInPlazoTiers(tiers: AccountPlazoTier[], days: number): boolean {
  return findAccountPlazoTier(tiers, days) != null
}
