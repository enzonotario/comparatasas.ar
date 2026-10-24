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

export interface TramoFal {
  titulo: string
  detalle: string | null
}

export interface AclaracionesFal {
  comun: string | null
  tramos: TramoFal[]
}

function oraciones(texto: string): string[] {
  return texto
    .split(/(?<=\.)\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean)
}

function nucleoOracion(oracion: string): string {
  return normalizar(oracion)
    .replace(/para todos los clientes/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
}

export function claveOfertaFal(
  row: Pick<
    AlternativaFal,
    'entidad' | 'horizonte' | 'vehiculo' | 'canal' | 'vigenciaDeclarada' | 'enlace'
  >,
): string {
  return [row.entidad, row.horizonte, row.vehiculo, row.canal, row.vigenciaDeclarada, row.enlace]
    .map((valor) => valor ?? '')
    .join('|')
}

export function aclaracionesDeTramos(rows: AlternativaFal[]): AclaracionesFal {
  const ordenados = [...rows].sort((a, b) => {
    const tasa = (row: AlternativaFal) =>
      row.comisionPosteriorAnual ?? row.comisionAnual ?? Number.POSITIVE_INFINITY
    return tasa(a) - tasa(b)
  })

  if (ordenados.length < 2) {
    const unico = ordenados[0]
    return {
      comun: null,
      tramos: unico ? [{ titulo: formatComisionFal(unico), detalle: unico.condiciones }] : [],
    }
  }

  const listas = ordenados.map((row) => oraciones(row.condiciones ?? ''))
  const primeras = listas.map((lista) => lista[0] ?? '')
  const nucleos = primeras.map(nucleoOracion)
  const comparten = nucleos.every((nucleo) => nucleo && nucleo === nucleos[0])
  const comun = comparten
    ? primeras.reduce((larga, actual) => (actual.length > larga.length ? actual : larga), '')
    : null

  return {
    comun,
    tramos: ordenados.map((row, indice) => ({
      titulo: row.nombrePlan || formatComisionFal(row),
      detalle: (comparten ? listas[indice]?.slice(1).join(' ') : row.condiciones) || null,
    })),
  }
}

export function resumenTasasFal(rows: AlternativaFal[]): string {
  if (rows.length === 1) return formatComisionFal(rows[0]!)

  const actuales = rows.map((row) => row.comisionAnual)
  const mismoActual = actuales.every((valor) => valor === actuales[0])
  const posteriores = rows
    .map((row) => row.comisionPosteriorAnual)
    .filter((valor): valor is number => valor != null)
    .sort((a, b) => a - b)

  if (mismoActual && actuales[0] != null && posteriores.length > 1) {
    const desde = formatTasaFal(posteriores[0]!)
    const hasta = formatTasaFal(posteriores[posteriores.length - 1]!)
    const actual = formatTasaFal(actuales[0])
    return desde === hasta ? `${actual} · luego ${desde}` : `${actual} · luego ${desde} a ${hasta}`
  }

  return formatComisionFal(rows[0]!)
}

export interface OfertaAgrupadaFal<T extends AlternativaFal = AlternativaFal> extends AlternativaFal {
  ofertas: T[]
}

export function agruparOfertasFal<T extends AlternativaFal>(rows: T[]): Array<OfertaAgrupadaFal<T>> {
  const grupos = new Map<string, T[]>()
  const orden: string[] = []

  for (const row of rows) {
    const clave = claveOfertaFal(row)
    const grupo = grupos.get(clave)
    if (grupo) grupo.push(row)
    else {
      grupos.set(clave, [row])
      orden.push(clave)
    }
  }

  return orden.map((clave) => {
    const ofertas = grupos.get(clave) ?? []
    const base = ofertas[0]!
    if (ofertas.length === 1) return { ...base, ofertas }

    const actuales = ofertas
      .map((oferta) => oferta.comisionAnual)
      .filter((valor): valor is number => valor != null)
    const posteriores = ofertas
      .map((oferta) => oferta.comisionPosteriorAnual)
      .filter((valor): valor is number => valor != null)

    return {
      ...base,
      plan: null,
      nombrePlan: null,
      condiciones: null,
      comisionAnual: actuales.length ? Math.min(...actuales) : null,
      comisionPosteriorAnual: posteriores.length ? Math.min(...posteriores) : null,
      ofertas,
    }
  })
}

export const tiposEmpresaFal = {
  mipyme: {
    id: 'mipyme',
    etiqueta: 'Micro / PyME (2,5%)',
    alicuota: 0.025,
  },
  grande: {
    id: 'grande',
    etiqueta: 'Grande Empresa (1,0%)',
    alicuota: 0.01,
  },
} as const

export type TipoEmpresaFalId = keyof typeof tiposEmpresaFal

export const presetsEmpleadosFal = [
  { empleados: 5, tipo: 'mipyme', sueldo: 1_000_000 },
  { empleados: 50, tipo: 'mipyme', sueldo: 1_400_000 },
  { empleados: 500, tipo: 'mipyme', sueldo: 1_400_000 },
  { empleados: 3000, tipo: 'grande', sueldo: 2_500_000 },
] as const satisfies ReadonlyArray<{
  empleados: number
  tipo: TipoEmpresaFalId
  sueldo: number
}>

export const presetsSueldoFal = [1_000_000, 1_400_000, 2_000_000, 2_500_000] as const

export function simularAporteFal(input: {
  empleados: number
  sueldoBruto: number
  alicuota: number
}) {
  const masaSalarial = input.empleados * input.sueldoBruto
  const aporteMensual = masaSalarial * input.alicuota

  return {
    masaSalarial,
    aporteMensual,
    capitalUnAnio: aporteMensual * 13,
    capitalTresAnios: aporteMensual * 39,
  }
}

export function formatMontoFal(valor: number): string {
  const compacto = (numero: number) =>
    (Math.round(numero * 10) / 10).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })

  if (valor >= 1_000_000_000) return `$${compacto(valor / 1_000_000_000)} MM`
  if (valor >= 1_000_000) return `$${compacto(valor / 1_000_000)} M`
  return `$${Math.round(valor).toLocaleString('es-AR')}`
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
