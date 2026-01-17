<script setup lang="ts">
import type { ProcessedFund } from '~/types/investments'
import { CHART_COLORS, formatCurrency, useChartTheme } from '~/composables/useChartConfig'

interface Props {
  funds: ProcessedFund[]
}

const props = defineProps<Props>()

const { textColor, gridLineColor } = useChartTheme()

const chartOption = computed(() => {
  // Filtrar fondos que tienen patrimonio
  const fundsWithPatrimonio = props.funds.filter(
    (f) => f.patrimonio !== null && f.patrimonio !== undefined && f.patrimonio > 0,
  )

  if (fundsWithPatrimonio.length === 0) return null

  // Ordenar por TNA de mayor a menor
  const sortedFunds = [...fundsWithPatrimonio].sort((a, b) => b.tna - a.tna)

  // Detectar puntos cercanos para usar offsets visuales
  const allFundsData = sortedFunds.map((f) => ({
    value: [f.patrimonio || 0, f.tna * 100] as [number, number],
    name: f.displayName || f.fondo,
    patrimonio: f.patrimonio || 0,
  }))

  // Agrupar puntos cercanos para asignar offsets visuales
  const groups: number[][] = []
  const maxPatrimonio = Math.max(...allFundsData.map((f) => f.patrimonio))

  for (let i = 0; i < allFundsData.length; i++) {
    let foundGroup = false
    for (const group of groups) {
      const firstIdx = group[0]
      const p1 = allFundsData[firstIdx]
      const p2 = allFundsData[i]

      const distanceY = Math.abs(p1.value[1] - p2.value[1])
      const distanceX = Math.abs(p1.value[0] - p2.value[0]) / (maxPatrimonio || 1)

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
  const scatterData = allFundsData.map((point, index) => {
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
      patrimonio: point.patrimonio,
      itemStyle: {
        color: CHART_COLORS[index % CHART_COLORS.length],
        borderColor: textColor.value === '#fff' ? '#000' : '#fff',
        borderWidth: 2,
        opacity: 0.9,
      },
    }
  })

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data
        return `${data.name}<br/>Patrimonio: ${formatCurrency(data.value[0])}<br/>TNA: ${data.value[1].toFixed(2)}%`
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
      name: 'Patrimonio (ARS)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: (value: number) => formatCurrency(value),
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
        name: 'Fondos',
        type: 'scatter',
        data: scatterData,
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            if (!params || !params.data) return ''
            const name = params.data.name || ''
            const tnaValue = params.data.value && Array.isArray(params.data.value) ? params.data.value[1] : null
            if (tnaValue === null || tnaValue === undefined) return name
            const tna = Number(tnaValue).toFixed(1)
            return `${name}\n${tna}%`
          },
          fontSize: 11,
          fontWeight: 'normal',
          color: textColor.value,
          backgroundColor: textColor.value === '#fff' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: textColor.value === '#fff' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          borderWidth: 1,
          borderRadius: 6,
          padding: [6, 10],
          distance: 15,
        },
        labelLayout: {
          hideOverlap: false,
          moveOverlap: 'shiftY',
          align: 'left',
          verticalAlign: 'middle',
          minMargin: 5,
        },
        emphasis: {
          scale: true,
          focus: 'self',
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
    <VChart
      v-if="chartOption"
      :option="chartOption"
      class="w-full h-full"
      autoresize
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-500">Cargando gráfico...</div>
    </div>
  </div>
</template>
