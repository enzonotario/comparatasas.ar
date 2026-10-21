export interface AlternativaFal {
  entidad: string
  nombreComercial: string
  plan: string | null
  nombrePlan: string | null
  vehiculo: string | null
  sociedadGerente: string | null
  sociedadDepositaria: string | null
  comisionAnual: number | null
  comisionEsTope: boolean
  incluyeIva: boolean | null
  ivaAdicional: boolean | null
  comisionVigenciaHasta: string | null
  comisionPosteriorAnual: number | null
  horizonte: string | null
  vidaPromedioMesesMin: number | null
  vidaPromedioMesesMax: number | null
  moneda: string
  reintegroAportes: boolean | null
  canal: string | null
  vigenciaDeclarada: string | null
  enlace: string | null
  condiciones: string | null
  metadata?: Record<string, unknown> | null
}

export interface FalFiltros {
  q: string
  horizonte: string
  vehiculo: string
  comision: string
}

export const horizonteLabels: Record<string, string> = {
  corto_plazo: 'Corto plazo',
  mediano_plazo: 'Mediano plazo',
  inflacion: 'Inflación / CER',
  rendimiento: 'Rendimiento',
}

export const vehiculoLabels: Record<string, string> = {
  fci_abierto: 'FCI abierto',
  fideicomiso: 'Fideicomiso',
}

export const canalLabels: Record<string, string> = {
  web: 'Web',
  asesor: 'Asesor',
  sucursal: 'Sucursal',
  formulario: 'Formulario',
  banca_empresas: 'Banca empresas',
}

export function alternativaFalId(row: Pick<AlternativaFal, 'entidad' | 'plan'>): string {
  return `${row.entidad}:${row.plan ?? 'general'}`
}

export function formatTasaFal(value: number): string {
  const porcentaje = value * 100
  const digitos = Number.isInteger(porcentaje) ? 0 : 2

  return `${porcentaje.toLocaleString('es-AR', {
    minimumFractionDigits: digitos,
    maximumFractionDigits: 2,
  })}%`
}

export function formatFechaFal(value: string | null): string | null {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatComisionFal(row: AlternativaFal): string {
  if (row.comisionAnual == null) return 'Sin dato'

  const partes = [
    `${row.comisionEsTope ? 'Hasta ' : ''}${formatTasaFal(row.comisionAnual)}`,
  ]
  const hasta = formatFechaFal(row.comisionVigenciaHasta)

  if (hasta) partes.push(`hasta ${hasta}`)
  if (row.comisionPosteriorAnual != null) {
    partes.push(`luego ${formatTasaFal(row.comisionPosteriorAnual)}`)
  }

  return partes.join(' · ')
}

export function formatVidaFal(row: AlternativaFal): string | null {
  const { vidaPromedioMesesMin: min, vidaPromedioMesesMax: max } = row

  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) return `${min}–${max} meses`
  return `${min ?? max} meses`
}

export function labelConocido(mapa: Record<string, string>, value: string | null): string {
  if (!value) return '—'
  return mapa[value] ?? value
}

function normalizar(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function filterAlternativasFal(rows: AlternativaFal[], filtros: FalFiltros): AlternativaFal[] {
  const q = normalizar(filtros.q)

  return rows.filter((row) => {
    if (filtros.horizonte !== 'all' && row.horizonte !== filtros.horizonte) return false
    if (filtros.vehiculo !== 'all' && row.vehiculo !== filtros.vehiculo) return false
    if (filtros.comision === 'publicada' && row.comisionAnual == null) return false
    if (filtros.comision === 'sin_dato' && row.comisionAnual != null) return false

    if (!q) return true

    const texto = normalizar(
      [
        row.nombreComercial,
        row.nombrePlan,
        row.sociedadGerente,
        row.condiciones,
        row.entidad,
      ].join(' '),
    )

    return texto.includes(q)
  })
}

function nuloAlFinal(a: number | null, b: number | null, direccion: number): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return (a - b) * direccion
}

export function sortAlternativasFal<T extends AlternativaFal>(
  rows: T[],
  sort: { id: string; desc: boolean } | null,
): T[] {
  const criterio = sort ?? { id: 'comisionSort', desc: false }
  const direccion = criterio.desc ? -1 : 1

  return [...rows].sort((a, b) => {
    if (criterio.id === 'comisionSort') {
      const porActual = nuloAlFinal(a.comisionAnual, b.comisionAnual, direccion)
      if (porActual !== 0) return porActual
      return nuloAlFinal(a.comisionPosteriorAnual, b.comisionPosteriorAnual, direccion)
    }

    const texto = (row: T) => String((row as Record<string, unknown>)[criterio.id] ?? '')
    return texto(a).localeCompare(texto(b), 'es') * direccion
  })
}
