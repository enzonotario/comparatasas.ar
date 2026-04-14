import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'

type ValueFormat = 'percent' | 'currencyCompact'

/**
 * Config compartida para VueUiVerticalBar (rankings con categorías en el eje).
 */
export function useVueDataUiVerticalBarConfig(valueFormat: ValueFormat) {
  const { textColor, gridLineColor } = useChartTheme()

  const valueSuffix = valueFormat === 'percent' ? '%' : ''
  const formatValue = (v: number) => {
    if (valueFormat === 'percent') return `${v.toFixed(2)}%`
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(v)
  }

  /** vue-data-ui llama al formatter con `{ value, config }`, no con el número suelto. */
  function dataLabelFormatter(payload: unknown): string {
    const raw =
      typeof payload === 'object' &&
      payload !== null &&
      'value' in payload &&
      typeof (payload as { value: unknown }).value === 'number'
        ? (payload as { value: number }).value
        : typeof payload === 'number'
          ? payload
          : Number(payload)
    if (!Number.isFinite(raw)) return ''
    return formatValue(raw)
  }

  const chartConfig = computed(() => ({
    debug: false,
    loading: false,
    responsive: true,
    theme: '',
    customPalette: CHART_COLORS,
    useCssAnimation: false,
    userOptions: {
      show: false,
      showOnChartHover: false,
      keepStateOnChartLeave: true,
      position: 'right',
      buttons: {
        tooltip: true,
        pdf: false,
        csv: false,
        img: false,
        table: false,
        labels: false,
        fullscreen: false,
        sort: false,
        stack: false,
        animation: false,
        annotator: false,
        svg: false,
        zoom: false,
        altCopy: false,
      },
    },
    style: {
      fontFamily: 'inherit',
      chart: {
        backgroundColor: 'transparent',
        color: textColor.value,
        height: 384,
        layout: {
          bars: {
            sort: 'desc',
            height: 22,
            gap: 6,
            borderRadius: 3,
            rowRadius: 3,
            useGradient: true,
            gradientIntensity: 20,
            fillOpacity: 90,
            underlayerColor: 'transparent',
            useStroke: false,
            dataLabels: {
              color: textColor.value,
              bold: true,
              fontSize: 11,
              value: {
                show: true,
                roundingValue: valueFormat === 'percent' ? 2 : 0,
                prefix: '',
                suffix: valueSuffix,
                formatter: valueFormat === 'currencyCompact' ? dataLabelFormatter : null,
              },
              percentage: { show: false, roundingPercentage: 0 },
              offsetX: 0,
            },
            nameLabels: {
              show: true,
              color: textColor.value,
              bold: false,
              fontSize: 10,
              offsetX: 0,
            },
            parentLabels: {
              show: false,
              color: textColor.value,
              bold: false,
              fontSize: 11,
              offsetX: 0,
              paddingBottom: 0,
            },
          },
          highlighter: { color: textColor.value, opacity: 5 },
          separators: {
            show: false,
            color: gridLineColor.value,
            strokeWidth: 1,
            fullWidth: true,
          },
        },
        title: {
          text: '',
          color: textColor.value,
          fontSize: 20,
          bold: true,
          textAlign: 'center',
          paddingLeft: 0,
          paddingRight: 0,
          subtitle: { color: '#A1A1A1', text: '', fontSize: 16, bold: false },
        },
        legend: {
          show: false,
          bold: false,
          backgroundColor: 'transparent',
          color: textColor.value,
          fontSize: 14,
          selectAllToggle: {
            show: false,
            backgroundColor: '#e1e5e8',
            color: textColor.value,
          },
          position: 'top',
          roundingValue: 0,
          roundingPercentage: 0,
          prefix: '',
          suffix: '',
        },
        tooltip: {
          show: true,
          color: textColor.value,
          backgroundColor: '#FFFFFF',
          fontSize: 14,
          customFormat: null,
          borderRadius: 4,
          borderColor: '#e1e5e8',
          borderWidth: 1,
          backgroundOpacity: 100,
          position: 'center',
          offsetY: 24,
          smooth: true,
          backdropFilter: false,
          teleportTo: 'body',
          showValue: true,
          showPercentage: false,
          roundingValue: valueFormat === 'percent' ? 2 : 0,
          roundingPercentage: 0,
          prefix: '',
          suffix: valueSuffix,
        },
      },
    },
    table: { show: false },
  }))

  return { chartConfig }
}
