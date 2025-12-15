<script setup lang="ts">
import { toValue } from 'vue'
import type { HipotecarioUVA } from '../composables/useHipotecariosUVA'
import type { InflacionData } from '../composables/useInflacion'
import type { InflacionREMData } from '../composables/useInflacionREM'
import { getInstitutionLogo } from '../lib/mappings/institutions'

const props = defineProps<{
  hipotecarios: HipotecarioUVA[]
  inflacionHistorica: InflacionData[]
  inflacionREM?: InflacionREMData[]
  inflacionFutura: number
  montoPropiedad: number
  porcentajeFinanciacion: number
  plazoAnos: number
  uvaInicial: number
  tipoCambio: number
  uvaHistorica?: Array<{ fecha: string; valor: number }>
}>()

const inflacionFuturaConfig = ref(props.inflacionFutura)
const montoPropiedadConfig = ref(props.montoPropiedad)
const porcentajeFinanciacionConfig = ref(props.porcentajeFinanciacion)
const plazoAnosConfig = ref(props.plazoAnos)
const tipoCambioConfig = ref(props.tipoCambio)
const uvaInicialConfig = ref(props.uvaInicial)

const calcularCuota = (
  tna: number,
  montoPrestamoInicial: number,
  plazoMeses: number,
  mesesTranscurridos: number,
  uvaActual: number,
): number => {
  const tasaMensual = tna / 100 / 12
  // El capital se ajusta según la variación del UVA desde el inicio
  const capitalAjustado = montoPrestamoInicial * (uvaActual / uvaInicialConfig.value)
  const mesesRestantes = plazoMeses - mesesTranscurridos
  if (mesesRestantes <= 0) return 0
  const cuota =
    (capitalAjustado * tasaMensual * Math.pow(1 + tasaMensual, mesesRestantes)) /
    (Math.pow(1 + tasaMensual, mesesRestantes) - 1)
  return cuota
}

const generarProyeccion = () => {
  const montoPrestamo =
    ((montoPropiedadConfig.value * porcentajeFinanciacionConfig.value) / 100) *
    tipoCambioConfig.value
  const plazoMeses = plazoAnosConfig.value * 12
  const fechaActual = new Date()
  const meses = []

  // Mapa de inflación histórica (real)
  const inflacionMap = new Map<string, number>()
  if (props.inflacionHistorica) {
    props.inflacionHistorica.forEach((inf) => {
      const fechaKey = inf.fecha.substring(0, 7)
      inflacionMap.set(fechaKey, inf.valor)
    })
  }

  // Mapa de inflación REM (tiene prioridad sobre histórica)
  const remMap = new Map<string, number>()
  const remTipoMap = new Map<string, string>()
  // Acceder al valor del prop - usar toValue para desenrollar cualquier ref/computed/getter
  const inflacionREMValue = toValue(props.inflacionREM)
  const inflacionREMArray = Array.isArray(inflacionREMValue) ? inflacionREMValue : []

  if (inflacionREMArray && inflacionREMArray.length > 0) {
    inflacionREMArray.forEach((inf) => {
      if (inf && inf.fecha && inf.valor !== undefined && inf.tipo) {
        const fechaKey = inf.fecha.substring(0, 7)
        remMap.set(fechaKey, inf.valor)
        remTipoMap.set(fechaKey, inf.tipo)
      }
    })
  }

  const uvaMap = new Map<string, number>()
  if (props.uvaHistorica) {
    props.uvaHistorica.forEach((uva) => {
      uvaMap.set(uva.fecha, uva.valor)
    })
  }

  let uvaActual = uvaInicialConfig.value
  let ultimaInflacion = inflacionFuturaConfig.value
  let ultimoTipoInflacion: string | null = null

  for (let i = -1; i < 20; i++) {
    const fecha = new Date(fechaActual)
    fecha.setMonth(fecha.getMonth() + i)
    const mes = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    const fechaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

    // Prioridad: REM > Histórica > Extender última disponible
    let inflacionMensual = ultimaInflacion
    let tipoInflacion: string | null = ultimoTipoInflacion

    if (remMap.has(fechaKey)) {
      inflacionMensual = remMap.get(fechaKey) || ultimaInflacion
      tipoInflacion = remTipoMap.get(fechaKey) || null
      ultimaInflacion = inflacionMensual
      ultimoTipoInflacion = tipoInflacion
    } else if (inflacionMap.has(fechaKey)) {
      inflacionMensual = inflacionMap.get(fechaKey) || ultimaInflacion
      tipoInflacion = 'Real'
      ultimaInflacion = inflacionMensual
      ultimoTipoInflacion = tipoInflacion
    } else {
      // Si no hay datos, usar la última inflación disponible
      tipoInflacion = ultimoTipoInflacion || 'Estimada'
    }

    let uvaEncontrado = false
    const uvasDelMes: Array<{ fecha: string; valor: number }> = []
    for (const [fechaUVAKey, valorUVA] of uvaMap.entries()) {
      if (fechaUVAKey.startsWith(fechaKey)) {
        uvasDelMes.push({ fecha: fechaUVAKey, valor: valorUVA })
      }
    }

    // Determinar el UVA para el cálculo de cuotas
    let uvaParaCalculo = uvaActual

    if (uvasDelMes.length > 0) {
      uvasDelMes.sort((a, b) => b.fecha.localeCompare(a.fecha))
      uvaActual = uvasDelMes[0].valor
      uvaEncontrado = true
      uvaParaCalculo = uvaActual
    } else {
      // Si no hay UVA histórico, calcularlo
      if (i < 0) {
        // Para el mes anterior, usar el UVA inicial sin ajustar
        uvaParaCalculo = uvaInicialConfig.value
      } else {
        // Para meses futuros, actualizar el UVA con la inflación
        uvaActual = uvaActual * (1 + inflacionMensual / 100)
        uvaParaCalculo = uvaActual
      }
    }

    // i va de -1 a 19
    // i = -1: mes anterior (aún no empezó el préstamo, mesesTranscurridos = 0, usar UVA inicial)
    // i = 0: primer mes del préstamo (mesesTranscurridos = 0, usar UVA después del primer ajuste)
    // i = 1: segundo mes (mesesTranscurridos = 1)
    const mesesTranscurridos = i >= 0 ? i : 0
    const cuotasPorBanco: Record<string, number> = {}
    props.hipotecarios.forEach((banco) => {
      cuotasPorBanco[banco.nombreComercial] = calcularCuota(
        banco.tna,
        montoPrestamo,
        plazoMeses,
        mesesTranscurridos,
        uvaParaCalculo,
      )
    })

    const promedio =
      Object.values(cuotasPorBanco).reduce((a, b) => a + b, 0) /
      Object.values(cuotasPorBanco).length

    meses.push({
      mes,
      fecha: fechaStr,
      inflacion: inflacionMensual,
      tipoInflacion,
      cuotasPorBanco,
      promedio,
      uva: uvaActual,
      rowspanTipo: 1,
      esPrimeraCeldaGrupo: false,
    })
  }

  // Calcular rowspan para las celdas de tipo de inflación
  let grupoActual: string | null = null
  let inicioGrupo = 0
  let contadorGrupo = 0

  for (let i = 0; i < meses.length; i++) {
    const tipoActual = meses[i].tipoInflacion || 'Estimada'

    if (tipoActual !== grupoActual) {
      // Si hay un grupo previo, asignar rowspan a la primera celda del grupo
      if (grupoActual !== null && contadorGrupo > 0) {
        meses[inicioGrupo].rowspanTipo = contadorGrupo
        meses[inicioGrupo].esPrimeraCeldaGrupo = true
        // Marcar las demás celdas del grupo para que no se rendericen
        for (let j = inicioGrupo + 1; j < inicioGrupo + contadorGrupo; j++) {
          meses[j].rowspanTipo = 0
        }
      }

      // Iniciar nuevo grupo
      grupoActual = tipoActual
      inicioGrupo = i
      contadorGrupo = 1
      meses[i].rowspanTipo = 1
      meses[i].esPrimeraCeldaGrupo = false
    } else {
      contadorGrupo++
      meses[i].rowspanTipo = 1
      meses[i].esPrimeraCeldaGrupo = false
    }
  }

  // Asignar rowspan al último grupo
  if (grupoActual !== null && contadorGrupo > 0) {
    meses[inicioGrupo].rowspanTipo = contadorGrupo
    meses[inicioGrupo].esPrimeraCeldaGrupo = true
    for (let j = inicioGrupo + 1; j < inicioGrupo + contadorGrupo; j++) {
      meses[j].rowspanTipo = 0
    }
  }

  return meses
}

// Hacer que el computed sea reactivo a los cambios en props.inflacionREM
const proyeccion = computed(() => {
  // Acceder a props.inflacionREM para que Vue rastree la dependencia
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = toValue(props.inflacionREM)
  return generarProyeccion()
})

const hipotecariosOrdenados = computed(() => {
  return [...props.hipotecarios].sort((a, b) => a.tna - b.tna)
})

const tnaPromedio = computed(() => {
  if (props.hipotecarios.length === 0) return 0
  const suma = props.hipotecarios.reduce((acc, banco) => acc + banco.tna, 0)
  return suma / props.hipotecarios.length
})

// Manejar hover de columna
const hoveredColumn = ref<number | null>(null)

const handleColumnHover = (columnIndex: number | null) => {
  hoveredColumn.value = columnIndex
}
</script>

<template>
  <UCard
    :ui="{
      body: '!p-0',
    }"
  >
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="text-xl font-bold">Evolución de cuotas hipotecarias UVA</h2>
          <p class="text-sm text-muted mt-1">Proyección de cuotas a pagar en pesos por mes</p>
        </div>

        <TwitterAttribution
          usuario="SalinasAndres"
          nombre="Andrés Salinas"
          avatar="https://pbs.twimg.com/profile_images/1802830575759224832/vKHC7OK1_400x400.jpg"
          url="https://x.com/SalinasAndres"
        />
      </div>
    </template>

    <div class="flex flex-row flex-wrap gap-4 p-2">
      <UFormField label="Monto de la propiedad" class="max-w-40">
        <UInput v-model.number="montoPropiedadConfig" type="number" step="1000" min="0">
          <template #trailing>USD</template>
        </UInput>
      </UFormField>
      <UFormField label="Porcentaje de financiación" class="max-w-50">
        <UInput
          v-model.number="porcentajeFinanciacionConfig"
          type="number"
          step="1"
          min="0"
          max="100"
        >
          <template #trailing>%</template>
        </UInput>
      </UFormField>
      <UFormField label="Plazo" class="max-w-40">
        <UInput v-model.number="plazoAnosConfig" type="number" step="1" min="1" max="30">
          <template #trailing>años</template>
        </UInput>
      </UFormField>
      <UFormField label="Inflación futura mensual" class="max-w-40">
        <UInput v-model.number="inflacionFuturaConfig" type="number" step="0.1" min="0" max="10">
          <template #trailing>%</template>
        </UInput>
      </UFormField>
      <UFormField label="Dólar Oficial" class="max-w-40">
        <UInput v-model.number="tipoCambioConfig" type="number" step="0.01" min="0">
          <template #trailing>ARS</template>
        </UInput>
      </UFormField>
      <UFormField label="UVA inicial" class="max-w-40">
        <UInput v-model.number="uvaInicialConfig" type="number" step="0.01" min="0">
          <template #trailing>ARS</template>
        </UInput>
      </UFormField>
    </div>

    <div class="overflow-x-auto" @mouseleave="handleColumnHover(null)">
      <table class="w-full border-collapse text-sm min-w-full table-hover">
        <thead>
          <tr class="border-b">
            <th
              class="text-left p-2 font-medium sticky left-0 bg-white dark:bg-neutral-950 z-30 border-r min-w-[80px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
            >
              Tipo
            </th>
            <th
              class="text-left p-2 font-medium sticky left-[80px] bg-white dark:bg-neutral-950 z-30 border-r min-w-[80px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
            >
              Inflación
            </th>
            <th
              class="text-left p-2 font-medium sticky left-[160px] bg-white dark:bg-neutral-950 z-30 border-r min-w-[80px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
            >
              Mes
            </th>
            <th
              v-for="(banco, bancoIndex) in hipotecariosOrdenados"
              :key="banco.nombreComercial"
              :data-column-index="bancoIndex + 3"
              class="text-center p-2 font-medium min-w-[100px] column-hover"
              :class="{ 'column-hovered': hoveredColumn === bancoIndex + 3 }"
              @mouseenter="handleColumnHover(bancoIndex + 3)"
              @mouseleave="handleColumnHover(null)"
            >
              <div class="flex flex-col items-center gap-1">
                <img
                  v-if="getInstitutionLogo(banco.entidad) || getInstitutionLogo(banco.nombreComercial)"
                  :src="getInstitutionLogo(banco.entidad) || getInstitutionLogo(banco.nombreComercial)"
                  :alt="banco.nombreComercial"
                  referrerpolicy="no-referrer"
                  class="size-8 rounded-full object-cover"
                />
                <div class="text-xs font-medium">{{ banco.nombreComercial }}</div>
                <div class="text-sm text-bold">{{ banco.tna.toFixed(1) }}%</div>
              </div>
            </th>
            <th
              :data-column-index="hipotecariosOrdenados.length + 3"
              class="text-center p-2 font-medium bg-gray-100 dark:bg-gray-800 min-w-[100px] column-hover"
              :class="{ 'column-hovered': hoveredColumn === hipotecariosOrdenados.length + 3 }"
              @mouseenter="handleColumnHover(hipotecariosOrdenados.length + 3)"
              @mouseleave="handleColumnHover(null)"
            >
              <div>Promedio</div>
              <div class="text-sm text-bold">{{ tnaPromedio.toFixed(1) }}%</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in proyeccion"
            :key="index"
            class="row-hover"
            :class="{ 'border-b': index < proyeccion.length - 1 }"
          >
            <td
              v-if="item.rowspanTipo > 0"
              :rowspan="item.rowspanTipo"
              class="p-2 font-medium sticky left-0 bg-white dark:bg-neutral-950 z-30 border-r row-hover-cell shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
              :class="{ 'vertical-text': item.rowspanTipo >= 2 }"
            >
              <span v-if="item.tipoInflacion" class="text-xs">
                {{ item.tipoInflacion }}
              </span>
              <span v-else class="text-xs text-muted">Estimada</span>
            </td>
            <td
              class="p-2 font-medium sticky left-[80px] bg-white dark:bg-neutral-950 z-30 border-r row-hover-cell shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
            >
              <div class="flex items-center gap-1">
                <span>{{ item.inflacion.toFixed(1) }}%</span>
              </div>
            </td>
            <td
              class="p-2 font-medium sticky left-[160px] bg-white dark:bg-neutral-950 z-30 border-r row-hover-cell shadow-[2px_0_4px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
            >
              {{ item.mes }}
            </td>
            <td
              v-for="(banco, bancoIndex) in hipotecariosOrdenados"
              :key="banco.nombreComercial"
              :data-column-index="bancoIndex + 3"
              class="text-center p-2 column-hover-cell"
              :class="{ 'column-hovered': hoveredColumn === bancoIndex + 3 }"
              @mouseenter="handleColumnHover(bancoIndex + 3)"
            >
              {{ Math.round(item.cuotasPorBanco[banco.nombreComercial]).toLocaleString('es-AR') }}
            </td>
            <td
              :data-column-index="hipotecariosOrdenados.length + 3"
              class="text-center p-2 font-semibold bg-gray-50 dark:bg-gray-900/50 column-hover-cell"
              :class="{ 'column-hovered': hoveredColumn === hipotecariosOrdenados.length + 3 }"
              @mouseenter="handleColumnHover(hipotecariosOrdenados.length + 3)"
            >
              {{ Math.round(item.promedio).toLocaleString('es-AR') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<style scoped>
/* Asegurar que las celdas sticky mantengan el z-index correcto */
.sticky {
  position: sticky !important;
}

/* Fondo base de las columnas sticky (sin hover) */
th.sticky,
td.sticky {
  background-color: rgb(255 255 255 / 1);
}

.dark th.sticky,
.dark td.sticky {
  background-color: rgb(10 10 10 / 1);
}

/* Hover de fila - incluye las celdas sticky */
.row-hover:hover .row-hover-cell {
  background-color: rgb(249 250 251 / 1) !important;
}

.dark .row-hover:hover .row-hover-cell {
  background-color: rgb(31 41 55 / 0.5) !important;
}

/* Hover de fila en celdas sticky */
.row-hover:hover td.sticky.row-hover-cell {
  background-color: rgb(249 250 251 / 1) !important;
}

.dark .row-hover:hover td.sticky.row-hover-cell {
  background-color: rgb(31 41 55 / 0.5) !important;
}

/* Hover de columna completa - para celdas normales */
.column-hover.column-hovered:not(.sticky),
.column-hover-cell.column-hovered:not(.sticky) {
  background-color: rgb(243 244 246 / 1) !important;
}

.dark .column-hover.column-hovered:not(.sticky),
.dark .column-hover-cell.column-hovered:not(.sticky) {
  background-color: rgb(31 41 55 / 0.7) !important;
}

/* Hover de columna en celdas sticky */
.column-hover-cell.column-hovered.sticky {
  background-color: rgb(243 244 246 / 1) !important;
}

.dark .column-hover-cell.column-hovered.sticky {
  background-color: rgb(31 41 55 / 0.7) !important;
}

/* Combinar hover de fila y columna - celdas normales */
.row-hover:hover .column-hover-cell.column-hovered:not(.sticky) {
  background-color: rgb(229 231 235 / 1) !important;
}

.dark .row-hover:hover .column-hover-cell.column-hovered:not(.sticky) {
  background-color: rgb(31 41 55 / 0.9) !important;
}

/* Combinar hover de fila y columna - celdas sticky */
.row-hover:hover .column-hover-cell.column-hovered.sticky {
  background-color: rgb(229 231 235 / 1) !important;
}

.dark .row-hover:hover .column-hover-cell.column-hovered.sticky {
  background-color: rgb(31 41 55 / 0.9) !important;
}

/* Estilos para el input de valor de inflación */
input[type='number'] {
  -moz-appearance: textfield;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Estilo para texto vertical cuando hay 2+ celdas unidas */
.vertical-text {
  text-align: center;
  vertical-align: middle;
  position: relative;
}

.vertical-text span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: inline-block;
  white-space: nowrap;
  transform: rotate(180deg);
  line-height: 1.2;
}
</style>
