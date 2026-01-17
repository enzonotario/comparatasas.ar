<script setup lang="ts">
import type { AccountItem } from '~/composables/useAccounts'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  accounts: AccountItem[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  // Separar cuentas con tope y sin límite
  const accountsWithTope = props.accounts.filter((a) => a.tope !== null && a.tope !== undefined)
  const accountsWithoutLimit = props.accounts.filter((a) => a.tope === null || a.tope === undefined)

  // Calcular el máximo tope para posicionar las cuentas sin límite
  const maxTope =
    accountsWithTope.length > 0 ? Math.max(...accountsWithTope.map((a) => a.tope!)) : 1000000

  // Valor para cuentas sin límite (1.5x el máximo tope)
  const sinLimiteValue = maxTope * 1.5

  // Detectar puntos cercanos para usar diferentes símbolos/offsets
  // Ordenar por TNA de mayor a menor
  const sortedAccountsWithTope = [...accountsWithTope].sort((a, b) => b.tna - a.tna)
  const sortedAccountsWithoutLimit = [...accountsWithoutLimit].sort((a, b) => b.tna - a.tna)

  const allAccountsData = [
    ...sortedAccountsWithTope.map((a) => ({
      value: [a.tope!, a.tna * 100] as [number, number],
      name: a.fondo,
      hasLimit: true,
    })),
    ...sortedAccountsWithoutLimit.map((a) => ({
      value: [sinLimiteValue, a.tna * 100] as [number, number],
      name: a.fondo,
      hasLimit: false,
    })),
  ]

  // Agrupar puntos cercanos para asignar diferentes símbolos/offsets visuales
  const groups: number[][] = []
  for (let i = 0; i < allAccountsData.length; i++) {
    let foundGroup = false
    for (const group of groups) {
      const firstIdx = group[0]
      const p1 = allAccountsData[firstIdx]
      const p2 = allAccountsData[i]

      const distanceY = Math.abs(p1.value[1] - p2.value[1])
      const distanceX = Math.abs(p1.value[0] - p2.value[0]) / (maxTope || 1)

      // Si están muy cerca (misma posición o casi)
      if (distanceY < 0.5 && distanceX < 0.05) {
        group.push(i)
        foundGroup = true
        break
      }
    }
    if (!foundGroup) {
      groups.push([i])
    }
  }

  // Crear scatterData con estilos y offsets visuales (sin modificar datos reales)
  const scatterData = allAccountsData.map((point, index) => {
    // Encontrar a qué grupo pertenece
    let groupIndex = -1
    let positionInGroup = 0
    for (let g = 0; g < groups.length; g++) {
      const pos = groups[g].indexOf(index)
      if (pos !== -1) {
        groupIndex = g
        positionInGroup = pos
        break
      }
    }

    // Si está en un grupo con múltiples puntos, usar offset visual para separarlos
    const isInGroup = groupIndex !== -1 && groups[groupIndex].length > 1
    const angle = isInGroup ? (positionInGroup * (2 * Math.PI)) / groups[groupIndex].length : 0
    const offsetRadius = isInGroup ? 10 : 0 // Offset visual en píxeles, no en datos

    // Calcular offset solo si está en un grupo
    const offsetX = isInGroup ? Math.cos(angle) * offsetRadius : 0
    const offsetY = isInGroup ? Math.sin(angle) * offsetRadius : 0

    return {
      value: point.value, // Mantener valores originales sin modificar
      name: point.name,
      symbolSize: 18,
      symbol: 'circle', // Usar solo círculos para evitar problemas con el renderizado
      symbolOffset: offsetX !== 0 || offsetY !== 0 ? [offsetX, offsetY] : undefined,
      hasLimit: point.hasLimit,
      itemStyle: {
        color: CHART_COLORS[index % CHART_COLORS.length],
        borderColor: textColor.value === '#fff' ? '#000' : '#fff',
        borderWidth: 2,
        opacity: 0.9,
      },
    }
  })

  if (scatterData.length === 0) return null

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data
        const topeText = data.hasLimit
          ? `Tope: ${formatCurrency(data.value[0])}`
          : 'Tope: Sin Límite'
        return `${data.name}<br/>${topeText}<br/>TNA: ${data.value[1].toFixed(2)}%`
      },
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '20%', // Más espacio abajo para el zoom
      top: '10%',
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 10,
        height: 20,
        handleIcon:
          'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,11.9v-1.3h-1.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C22.1,16.3,18.2,12.2,13.3,11.9z',
        handleSize: '80%',
        handleStyle: {
          color: textColor.value === '#fff' ? '#fff' : '#333',
          borderColor: textColor.value === '#fff' ? '#fff' : '#ccc',
        },
        textStyle: {
          color: textColor.value,
        },
        borderColor: gridLineColor.value,
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
        minSpan: 5, // Límite mínimo de zoom (5% del rango)
        maxSpan: 100, // Límite máximo de zoom (100% del rango)
      },
    ],
    xAxis: {
      type: 'value',
      name: 'Tope (ARS)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: ((sinLimiteVal: number) => (value: number) => {
          // Detectar si es el valor de "Sin Límite" (comparar con un rango)
          if (Math.abs(value - sinLimiteVal) < sinLimiteVal * 0.1) {
            return 'Sin Límite'
          }
          if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
          return `$${value}`
        })(sinLimiteValue),
        color: textColor.value,
      },
      nameTextStyle: {
        color: textColor.value,
      },
      splitLine: {
        lineStyle: {
          color: gridLineColor.value,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'TNA (%)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: (value: number) => `${value.toFixed(1)}%`,
        color: textColor.value,
      },
      nameTextStyle: {
        color: textColor.value,
      },
      splitLine: {
        lineStyle: {
          color: gridLineColor.value,
        },
      },
    },
    series: [
      {
        name: 'Cuentas',
        type: 'scatter',
        data: scatterData,
        // No usar large: true ya que causa problemas con symbolOffset y zoom
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            if (!params || !params.data) return ''
            const name = params.data.name || ''
            const tnaValue =
              params.data.value && Array.isArray(params.data.value) ? params.data.value[1] : null
            if (tnaValue === null || tnaValue === undefined) return name
            const tna = Number(tnaValue).toFixed(1)
            return `${name}\n${tna}%`
          },
          fontSize: 11,
          fontWeight: 'normal',
          color: textColor.value,
          backgroundColor:
            textColor.value === '#fff' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          borderColor:
            textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1,
          borderRadius: 6,
          padding: [6, 10], // Aumentado: [vertical, horizontal] para mejor legibilidad
          distance: 15, // Aumentada la distancia entre el punto y la etiqueta
          rich: {
            name: {
              fontSize: 11,
              fontWeight: 'bold',
              lineHeight: 16,
            },
            tna: {
              fontSize: 10,
              fontWeight: 'normal',
              lineHeight: 16,
            },
          },
        },
        labelLayout: {
          // Usar algoritmo de ECharts para evitar solapamiento de etiquetas
          hideOverlap: false,
          moveOverlap: 'shiftY', // Mover etiquetas que se solapan verticalmente
          // Configuración avanzada para mejor distribución
          align: 'left',
          verticalAlign: 'middle',
          // Aumentar el espacio mínimo entre etiquetas
          minMargin: 5,
        },
        emphasis: {
          scale: true,
          focus: 'self', // Enfocar solo el punto seleccionado
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
      },
    ],
    backgroundColor: 'transparent',
  }
})
</script>

<template>
  <div class="w-full" style="height: 24rem; min-height: 384px">
    <VChart v-if="chartOption" :option="chartOption" class="w-full h-full" autoresize />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
