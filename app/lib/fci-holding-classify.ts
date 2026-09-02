export type HoldingKind =
  | 'plazosFijos'
  | 'cauciones'
  | 'cuentas'
  | 'letras'
  | 'titulosPublicos'
  | 'ons'
  | 'acciones'
  | 'cedears'
  | 'otros'

export const HOLDING_KIND_LABELS: Record<HoldingKind, string> = {
  plazosFijos: 'Plazos fijos',
  cauciones: 'Cauciones / pases',
  cuentas: 'Cuentas y liquidez',
  letras: 'Letras y LECAPs',
  titulosPublicos: 'Títulos públicos',
  ons: 'Obligaciones negociables',
  acciones: 'Acciones',
  cedears: 'CEDEARs / ADRs',
  otros: 'Otros',
}

function normalizeHoldingName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function classifyHolding(nombre: string | null | undefined): HoldingKind {
  const name = normalizeHoldingName(nombre || '')
  if (!name) return 'otros'

  if (/cedear|\badr\b/.test(name)) return 'cedears'
  if (name.includes('obligacion negociable') || name.startsWith('on ') || /\bon\b/.test(name)) {
    return 'ons'
  }
  if (/pzo fi|plazo fi|plazo fijo/.test(name)) return 'plazosFijos'
  if (/caucion|pase colocador/.test(name)) return 'cauciones'
  if (/cta cte|cuenta cte|cuenta corriente|cta rem|cuenta rem/.test(name)) return 'cuentas'
  if (/lecap|\blec\b|lecer|letra tesoro|letra tamar|\bletra\b/.test(name)) return 'letras'
  if (/bono|boncer|bonar|al3[0-9]|gd3[0-9]|ae3[0-9]/.test(name)) return 'titulosPublicos'
  if (/accion|\bypf\b|ggal|pamp|come|txar/.test(name)) return 'acciones'
  if (name === 'resto de activos' || name.startsWith('resto ')) return 'otros'

  return 'otros'
}
