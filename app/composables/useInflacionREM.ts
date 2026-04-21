export interface InflacionREMData {
  tipo: string
  fecha: string
  valor: number
}

/** Fila del endpoint https://api.argentinadatos.com/v1/rems/ultimo */
interface RemUltimoRow {
  muestra: string
  indicador: string
  periodo: string
  periodoTipo: string
  periodoDesde: string | null
  promedio: number
}

const IPC_NIVEL_GENERAL = 'IPC nivel general'

/** Meses YYYY-MM desde (inclusive) hasta (inclusive). */
function iterMonthKeys(fromYm: string, toYm: string): string[] {
  const [fy, fm] = fromYm.split('-').map(Number)
  const [ty, tm] = toYm.split('-').map(Number)
  const out: string[] = []
  let y = fy
  let m = fm
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

function buildInflacionRemFromRemUltimo(rows: RemUltimoRow[]): InflacionREMData[] {
  const ipcTodos = rows.filter(
    (r) =>
      r.muestra === 'todos' &&
      typeof r.indicador === 'string' &&
      r.indicador.includes(IPC_NIVEL_GENERAL),
  )

  const mensualPorMes = new Map<string, number>()
  for (const r of ipcTodos) {
    if (r.periodoTipo !== 'mensual' || !r.periodoDesde) continue
    const key = r.periodoDesde.slice(0, 7)
    mensualPorMes.set(key, r.promedio)
  }

  const prox24 = ipcTodos.find((r) => r.periodoTipo === 'proximos_24_meses')
  const ipcProx24Mensual = prox24 !== undefined ? prox24.promedio / 12 : null

  if (mensualPorMes.size === 0 && ipcProx24Mensual === null) {
    return []
  }

  const mesesMensuales = [...mensualPorMes.keys()].sort()
  const now = new Date()
  const yMinMensual = mesesMensuales.length
    ? Number(mesesMensuales[0].slice(0, 4))
    : now.getFullYear()
  const yMaxMensual = mesesMensuales.length
    ? Number(mesesMensuales[mesesMensuales.length - 1]!.slice(0, 4))
    : now.getFullYear()

  const fromYm = `${Math.min(yMinMensual, now.getFullYear()) - 1}-01`
  const toYm = `${Math.max(yMaxMensual, now.getFullYear() + 10)}-12`

  const out: InflacionREMData[] = []
  for (const ym of iterMonthKeys(fromYm, toYm)) {
    if (mensualPorMes.has(ym)) {
      out.push({
        fecha: `${ym}-01`,
        valor: mensualPorMes.get(ym)!,
        tipo: 'REM (IPC mensual)',
      })
    } else if (ipcProx24Mensual !== null) {
      out.push({
        fecha: `${ym}-01`,
        valor: ipcProx24Mensual,
        tipo: 'REM (IPC próx. 24 m. ÷12)',
      })
    }
  }

  return out
}

const data = ref<InflacionREMData[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useInflacionREM() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<RemUltimoRow[]>('https://api.argentinadatos.com/v1/rems/ultimo')
      data.value = buildInflacionRemFromRemUltimo(response)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const inflacionREM = computed(() => {
    return data.value ?? []
  })

  const inflacionREMPorFecha = computed(() => {
    const map = new Map<string, number>()
    ;(data.value ?? []).forEach((item) => {
      const fechaKey = item.fecha.substring(0, 7)
      map.set(fechaKey, item.valor)
    })
    return map
  })

  return {
    inflacionREM,
    inflacionREMPorFecha,
    loading,
    error,
    fetch,
  }
}
