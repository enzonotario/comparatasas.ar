export type ManagerKind = 'banco' | 'independiente'

const BANK_NAME_RE =
  /\bbanco\b|\bbancor\b|\bbbv\b|\bbavsa\b|\bgalicia\b|\bsantander\b|\bmacro\b|\bicbc\b|\bhsbc\b|\bpatagonia\b|\bciudad\b|\bnacion\b|\bpellegrini\b|\bsupervielle\b|\bitau\b|\bcomafi\b|\bcredicoop\b|\bhipotecario\b|\bprovincia\b|\bprovinfondos\b|\bindustrial\b|\bmariva\b|\bcmf\b|\bvalores\b|\bbind\b/

export function isBankManager(name: string | null | undefined) {
  const normalized = (name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

  return BANK_NAME_RE.test(normalized)
}

export function getManagerKind(name: string | null | undefined): ManagerKind {
  return isBankManager(name) ? 'banco' : 'independiente'
}

export function shortManagerName(name: string | null | undefined) {
  const raw = (name || '').trim()
  if (!raw) return '—'

  return raw
    .replace(/\s+Asset Managemet\b/i, '')
    .replace(/\s+Asset Management\b.*$/i, '')
    .replace(/\s+Fondos Administrados\b.*$/i, '')
    .replace(/\s+Administradora de Activos\b.*$/i, '')
    .replace(/\s+Administradora de Fondos\b.*$/i, '')
    .replace(/\s+Investments Argentina\b.*$/i, '')
    .replace(/\s+Inversora\b.*$/i, '')
    .replace(/\s+Fondos\b.*$/i, '')
    .replace(/\s+S\.?G\.?F\.?C\.?I\.?.*$/i, '')
    .replace(/\s+S\.?A\.?.*$/i, '')
    .trim() || raw
}
