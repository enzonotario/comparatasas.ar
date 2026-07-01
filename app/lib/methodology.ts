export interface MethodologyBlock {
  type: 'p' | 'ul' | 'formula'
  text?: string
  items?: string[]
}

export interface MethodologySection {
  id: string
  title: string
  category: string
  categoryLabel: string
  source?: string
  blocks: MethodologyBlock[]
}

export const methodologyCategories: Array<{ id: string; label: string }> = [
  { id: 'cuentas', label: 'Cuentas y billeteras' },
  { id: 'fci', label: 'Fondos comunes de inversión' },
  { id: 'plazos-fijos', label: 'Plazos fijos' },
  { id: 'titulos', label: 'Títulos públicos' },
  { id: 'usd-crypto', label: 'USD y cripto' },
  { id: 'otros', label: 'Otros productos' },
  { id: 'simulador', label: 'Simulador' },
]

export const methodologySections: MethodologySection[] = [
  {
    id: 'cuentas-garantizado',
    title: 'Rendimiento garantizado (cuentas remuneradas y billeteras)',
    category: 'cuentas',
    categoryLabel: 'Cuentas y billeteras',
    source: 'CAFCI / plataformas',
    blocks: [
      {
        type: 'p',
        text: 'Las tasas representan la TNA (y TEA cuando está disponible) publicada por cada plataforma para su producto de saldo remunerado o cuenta remunerada, según la información disponible en CAFCI.',
      },
      {
        type: 'p',
        text: 'No las calculamos nosotros: mostramos el valor informado por la entidad, junto con topes, condiciones y fecha de vigencia cuando la fuente los trae.',
      },
      {
        type: 'ul',
        items: [
          'Productos con plazo fijo dentro de la billetera (ej. Frascos de Naranja X) pueden tener varias TNAs según los días que elijas; mostramos cada tramo con su rango de plazo.',
          'En el simulador, si el producto tiene tope, solo se remuneran los primeros pesos hasta ese límite (salvo casos especiales documentados, como Fiwind).',
        ],
      },
    ],
  },
  {
    id: 'cuentas-fci-variables',
    title: 'Rendimiento variable publicado por plataforma',
    category: 'cuentas',
    categoryLabel: 'Cuentas y billeteras',
    source: 'CAFCI / plataformas',
    blocks: [
      {
        type: 'p',
        text: 'Algunas billeteras y cuentas con rendimiento variable publican TNA y TEA directamente; no las derivamos comparando valores cuotaparte día a día.',
      },
      {
        type: 'p',
        text: 'Los mostramos tal como vienen de la fuente, con sus condiciones y topes cuando existen.',
      },
    ],
  },
  {
    id: 'fci-mercado-dinero',
    title: 'FCI de mercado de dinero',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CAFCI',
    blocks: [
      {
        type: 'p',
        text: 'Es el método por defecto del sitio. Tomamos el rendimiento del último mes informado por CAFCI y lo convertimos a TNA y TEA.',
      },
      {
        type: 'formula',
        text: 'Rendimiento base = unMes; si falta, ultimos7Dias',
      },
      {
        type: 'formula',
        text: 'TNA = rendimiento mensual ÷ 100 (el mes se toma como TNA directa, sin proyectar a 365 días)',
      },
      {
        type: 'formula',
        text: 'TEA = (1 + rendimiento mensual ÷ 100)^12 − 1',
      },
      {
        type: 'p',
        text: 'Ejemplo: si unMes = 16,5 → TNA mostrada = 16,50%.',
      },
    ],
  },
  {
    id: 'fci-renta-fija',
    title: 'FCI de renta fija y demás tipos (mixta, variable, retorno total)',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CAFCI',
    blocks: [
      {
        type: 'p',
        text: 'Usamos el rendimiento del último mes (unMes) publicado por CAFCI. A diferencia de mercado de dinero, acá el mes se anualiza de forma lineal.',
      },
      {
        type: 'formula',
        text: 'Rendimiento base = unMes (si falta, 0)',
      },
      {
        type: 'formula',
        text: 'TNA = (rendimiento mensual ÷ 100) × (365 ÷ 30)',
      },
      {
        type: 'formula',
        text: 'TEA = (1 + rendimiento mensual ÷ 100)^12 − 1',
      },
      {
        type: 'p',
        text: 'Ejemplo: si unMes = 3 → TNA mostrada = 36,50%.',
      },
    ],
  },
  {
    id: 'fci-series-vcp',
    title: 'Método alternativo por series de VCP (CAFCI)',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CAFCI (series de VCP)',
    blocks: [
      {
        type: 'p',
        text: 'Como método alternativo, comparamos el valor cuotaparte (VCP) más reciente con el de hace ~30 días (retrocediendo día a día si falta el dato exacto), usando las series históricas de CAFCI.',
      },
      {
        type: 'formula',
        text: 'Rendimiento del período = (VCP nuevo − VCP anterior) ÷ VCP anterior',
      },
      {
        type: 'formula',
        text: 'Rendimiento diario = rendimiento del período ÷ días entre fechas',
      },
      {
        type: 'formula',
        text: 'TNA = rendimiento diario × 365',
      },
      {
        type: 'formula',
        text: 'TEA = (1 + rendimiento diario)^365 − 1',
      },
      {
        type: 'p',
        text: 'La tabla de /fondos y algunos gráficos pueden usar este método para mostrar rendimiento efectivo entre dos VCP consecutivos de la serie.',
      },
    ],
  },
  {
    id: 'plazos-fijos-tradicional',
    title: 'Plazos fijos tradicionales',
    category: 'plazos-fijos',
    categoryLabel: 'Plazos fijos',
    source: 'Entidades financieras',
    blocks: [
      {
        type: 'p',
        text: 'Las TNAs provienen de los datos publicados por cada entidad. Cada banco puede publicar varias tasas según monto y rango de días; la tabla agrupa por columnas estándar (30, 60, 90 y 365 días).',
      },
      {
        type: 'p',
        text: 'La TNA de referencia para ordenar la tabla es la aplicable a 30 días cuando existe. En el simulador usamos interés simple y, para el plazo fijo clásico sin tramos, 30 días fijos salvo que elijas otro horizonte en productos con tramos.',
      },
      {
        type: 'formula',
        text: 'Ganancia estimada ≈ capital × TNA × (días ÷ 365)',
      },
    ],
  },
  {
    id: 'plazos-fijos-uva-periodico',
    title: 'Plazo fijo UVA con pago periódico',
    category: 'plazos-fijos',
    categoryLabel: 'Plazos fijos',
    source: 'Entidades financieras',
    blocks: [
      {
        type: 'p',
        text: 'Mostramos la TNA y el rango de plazo (mínimo y máximo en días) informados por cada proveedor. El simulador solo aplica la fila si los días elegidos caen dentro de ese rango.',
      },
    ],
  },
  {
    id: 'plazos-fijos-uva-precancelable',
    title: 'Plazo fijo UVA precancelable',
    category: 'plazos-fijos',
    categoryLabel: 'Plazos fijos',
    source: 'Entidades financieras',
    blocks: [
      {
        type: 'p',
        text: 'Incluye TNA a vencimiento y, cuando la fuente lo trae, TNA de precancelación. Cada fila tiene plazo mínimo/máximo y reglas de aviso de precancelación según la entidad.',
      },
    ],
  },
  {
    id: 'lecaps-boncaps',
    title: 'LECAPs y BONCAPs',
    category: 'titulos',
    categoryLabel: 'Títulos públicos',
    blocks: [
      {
        type: 'p',
        text: 'Usamos precio de mercado, pago final al vencimiento y días hasta el vencimiento (desde la fecha de liquidación operativa) para estimar rentabilidad.',
      },
      {
        type: 'formula',
        text: 'Factor de ganancia = pago final ÷ precio',
      },
      {
        type: 'formula',
        text: 'TNA = (factor − 1) × (365 ÷ días)',
      },
      {
        type: 'formula',
        text: 'TIR = factor^(365 ÷ días) − 1',
      },
      {
        type: 'p',
        text: 'En el simulador, la ganancia compuesta usa la TIR como tasa anual efectiva y limita los días al mínimo entre tu horizonte y los días al vencimiento del papel.',
      },
    ],
  },
  {
    id: 'bonos-cer',
    title: 'Bonos CER',
    category: 'titulos',
    categoryLabel: 'Títulos públicos',
    source: 'Mercado de títulos públicos',
    blocks: [
      {
        type: 'p',
        text: 'Mostramos precio en pesos, fecha de vencimiento y TIR en porcentaje tal como viene de la fuente de mercado. Los días al vencimiento se calculan en calendario desde hoy para contexto en la UI.',
      },
    ],
  },
  {
    id: 'usd',
    title: 'Inversiones en USD',
    category: 'usd-crypto',
    categoryLabel: 'USD y cripto',
    blocks: [
      {
        type: 'ul',
        items: [
          'Cuentas remuneradas en USD: TNA publicada por la plataforma.',
          'Billeteras en USD: APY informado por cada entidad para depósitos en dólares.',
          'FCI en USD: rendimiento del último mes de CAFCI o series de VCP, según el tipo de fondo.',
        ],
      },
    ],
  },
  {
    id: 'crypto-apy',
    title: 'Criptomonedas (staking / earn)',
    category: 'usd-crypto',
    categoryLabel: 'USD y cripto',
    blocks: [
      {
        type: 'p',
        text: 'Mostramos el APY (Annual Percentage Yield) que cada plataforma publica para cada moneda. Si una entidad informa más de un rendimiento para la misma crypto, tomamos el mayor.',
      },
    ],
  },
  {
    id: 'criptopesos',
    title: 'Criptopesos',
    category: 'usd-crypto',
    categoryLabel: 'USD y cripto',
    blocks: [
      {
        type: 'p',
        text: 'Las TNAs provienen directamente de las plataformas para sus tokens en pesos (DAI, USDT, etc. atados a ARS). No las anualizamos ni las recalculamos.',
      },
    ],
  },
  {
    id: 'creditos-hipotecarios-uva',
    title: 'Créditos hipotecarios UVA',
    category: 'otros',
    categoryLabel: 'Otros productos',
    blocks: [
      {
        type: 'p',
        text: 'Listamos la TNA de referencia de cada banco para créditos hipotecarios UVA. Es un dato informativo de costo de financiación, no un rendimiento de inversión. Ordenamos de menor a mayor tasa.',
      },
    ],
  },
  {
    id: 'contado-cuotas',
    title: 'Contado vs cuotas',
    category: 'otros',
    categoryLabel: 'Otros productos',
    blocks: [
      {
        type: 'p',
        text: 'Comparamos el precio de contado con el plan en cuotas para estimar el recargo implícito y la TEA equivalente del financiamiento.',
      },
      {
        type: 'formula',
        text: 'Total financiado = cuota × cantidad de cuotas',
      },
      {
        type: 'formula',
        text: 'Recargo nominal = (total financiado ÷ precio contado) − 1',
      },
      {
        type: 'p',
        text: 'Opcionalmente se puede descontar el flujo de cuotas con una curva de inflación mensual para estimar el costo real en pesos de hoy.',
      },
    ],
  },
  {
    id: 'simulador',
    title: 'Simulador de inversión (ganancia estimada)',
    category: 'simulador',
    categoryLabel: 'Simulador',
    blocks: [
      {
        type: 'ul',
        items: [
          'Cuentas, billeteras y FCI: interés compuesto diario con TNA ÷ 365.',
          'Plazos fijos y productos con TNA en porcentaje entero publicado: interés simple (capital × TNA × días ÷ 365).',
          'Topes: si superás el límite, solo se calcula rendimiento sobre el monto remunerado (excepto Fiwind, que usa Delta Pesos para el excedente).',
          'Productos con tramos de plazo o monto: la fila se desactiva si tu simulación no cae en un tramo válido.',
        ],
      },
    ],
  },
]
