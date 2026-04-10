import { useChartTheme } from '~/composables/useChartConfig'

/**
 * Props de tooltip de vue-data-ui con fondo sólido (sin blur/glass), alineado a TNAGroupedTnaChart.
 * Usar con spread en `chart.tooltip` o `style.layout.tooltip` según el componente.
 *
 * Nota: si el chart usa `customFormat`, vue-data-ui marca el tooltip como `isCustom` y **no** aplica
 * background/color inline; el aspecto sólido depende de `globals.css` (`.vue-data-ui-custom-tooltip`).
 */
export function useVueDataUiSolidTooltip() {
  const { textColor, colorMode } = useChartTheme()

  return computed(() => ({
    color: textColor.value,
    backgroundColor: colorMode.value === 'dark' ? '#171717' : '#FFFFFF',
    fontSize: 14,
    borderRadius: 4,
    borderColor: colorMode.value === 'dark' ? '#404040' : '#e1e5e8',
    borderWidth: 1,
    backgroundOpacity: 100,
    position: 'center' as const,
    offsetY: 24,
    smooth: true,
    backdropFilter: false,
    smoothForce: 0.18,
    smoothSnapThreshold: 0.25,
    teleportTo: 'body',
  }))
}
