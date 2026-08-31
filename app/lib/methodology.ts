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
    source: 'CNV / Argentina Datos',
    blocks: [
      {
        type: 'p',
        text: 'Es el método por defecto del sitio para todos los FCI. La planilla CNV publica retornos de período; estimamos la TNA nominal a 365 días a partir del retorno ~30D (no de un solo día, que es ruidoso).',
      },
      {
        type: 'formula',
        text: 'TNA = unMes × 365 / 30 (si falta: ultimos7Dias × 365 / 7; si falta: variacionDiariaPct × 365)',
      },
      {
        type: 'formula',
        text: 'TEA = (1 + TNA ÷ 365)^365 − 1',
      },
      {
        type: 'p',
        text: 'Ejemplo: si unMes = 1,54% → TNA mostrada = 18,73%.',
      },
    ],
  },
  {
    id: 'fci-renta-fija',
    title: 'FCI de renta fija y demás tipos (mixta, variable, retorno total)',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CNV / Argentina Datos',
    blocks: [
      {
        type: 'p',
        text: 'Usamos la misma estimación de TNA nominal que en money market: retorno ~30D (rolling desde VCP en el detalle; columna CNV `unMes` en el catálogo si falta histórico), con fallback a 7D y 1D.',
      },
      {
        type: 'formula',
        text: 'En listados usamos TNA precomputada en build (`public/api/fci/nominal-tna.json`) con días efectivos del lookback VCP para fondos curados y sus clases hermanas. El resto del catálogo cae a unMes × 365 / 30. El detalle recalcula con el histórico del fondo abierto.',
      },
      {
        type: 'formula',
        text: 'TEA = (1 + TNA ÷ 365)^365 − 1',
      },
      {
        type: 'p',
        text: 'En el detalle, los días del divisor son los días efectivos del lookback VCP (p. ej. 29 en lugar de 30). Ejemplo: 30D = 1,59% → TNA ≈ 19,98% con 29 días.',
      },
    ],
  },
  {
    id: 'fci-detalle-periodos',
    title: 'Rendimientos del detalle FCI (1D, 30D, YTD, 1Y…)',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CNV / Argentina Datos (serie de VCP)',
    blocks: [
      {
        type: 'p',
        text: 'En el detalle del fondo y en el catálogo mostramos retornos de período rolling desde la serie de VCP: 7D/30D/90D/180D/1Y y YTD. La columna CNV “un mes” es variación vs fin de mes previo — no es 30D rolling — y solo se usa como fallback. Los `noventaDias`/`cientoOchentaDias` legacy de CAFCI suelen venir anualizados y no se usan como período.',
      },
      {
        type: 'formula',
        text: 'Rendimiento N días = (VCP_hoy ÷ VCP_hace_N) − 1',
      },
      {
        type: 'formula',
        text: 'Si falta histórico, fallback a columnas CNV de período (1D, unMes, YTD, 12M)',
      },
      {
        type: 'p',
        text: 'Ejemplo: unMes CNV ≈ 0,65% (desde fin de mes previo) vs 30D rolling ≈ 1,47% — catálogo y detalle muestran el rolling.',
      },
    ],
  },
  {
    id: 'fci-series-vcp',
    title: 'Método alternativo por series de VCP',
    category: 'fci',
    categoryLabel: 'Fondos comunes de inversión',
    source: 'CNV / Argentina Datos (series de VCP)',
    blocks: [
      {
        type: 'p',
        text: 'Como método alternativo (rankings curados y algunos gráficos), comparamos el valor cuotaparte (VCP) más reciente con el de hace ~30 días (retrocediendo día a día si falta el dato exacto), usando las series históricas publicadas vía Argentina Datos.',
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
        text: 'La tabla de /fondos usa el catálogo CNV (retornos de período + TNA MM vía unMes × 365/30); este método de series de VCP queda como alternativa para rankings y visualizaciones históricas.',
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
        type: 'formula',
        text: 'TEM = factor^(30 ÷ días) − 1',
      },
      {
        type: 'p',
        text: 'La TEM es la tasa efectiva mensual implícita en el precio (base 30 días). Equivale a (1+TIR)^(30/365)−1. En la curva podés alternar TIR vs TEM.',
      },
      {
        type: 'p',
        text: 'En el simulador, la ganancia compuesta usa la TIR como tasa anual efectiva y limita los días al mínimo entre tu horizonte y los días al vencimiento del papel.',
      },
    ],
  },
  {
    id: 'cauciones',
    title: 'Cauciones',
    category: 'titulos',
    categoryLabel: 'Títulos públicos',
    source: 'ArgentinaDatos (mercado de cauciones)',
    blocks: [
      {
        type: 'p',
        text: 'Mostramos plazo en días, tasa actual, tasa min./max. del día, monto contado, fecha de operación y vencimiento para cauciones en ARS y USD, tal como publica ArgentinaDatos. Omitimos filas cuyo plazo no calza con el vencimiento (series espurias de la fuente).',
      },
      {
        type: 'p',
        text: 'En la curva usamos la tasa actual vs plazo; el tamaño del punto refleja el monto contado relativo de cada plazo.',
      },
      {
        type: 'p',
        text: 'Comparamos también las comisiones de brokers (IOL, Balanz, Bull Market, Cocos, PPI, Fiwind e IEB+) para cauciones en ARS y USD, según el tarifario retail publicado en ArgentinaDatos (/v1/finanzas/brokers/comisiones). Mostramos tasa publicada y equivalente anual en rol colocadora (las tasas de mercado informadas son colocadora). Si el broker tiene membresía de plan (p. ej. IEB+), la mostramos junto a la comisión. La comparación completa de todos los productos está en /comisiones-brokers.',
      },
      {
        type: 'p',
        text: 'En la tabla de mercado, la columna «Tasa neta» resta comisión + IVA y derecho de mercado al TNA de mercado colocadora, prorrateados al plazo de cada fila. Podés elegir broker en el selector (uno aleatorio por defecto; persiste en ?broker=).',
      },
    ],
  },
  {
    id: 'comisiones-brokers',
    title: 'Comisiones de brokers',
    category: 'otros',
    categoryLabel: 'Otros productos',
    source: 'ArgentinaDatos (/v1/finanzas/brokers/comisiones)',
    blocks: [
      {
        type: 'p',
        text: 'Comparamos aranceles retail de ALyC (IOL, Balanz, Bull Market, Cocos, PPI, Fiwind e IEB+) por producto: acciones, CEDEARs, bonos, obligaciones negociables, letras, cauciones, opciones, futuros, FCI, cheques, licitaciones y alquiler de títulos. Los datos vienen de ArgentinaDatos y se actualizan cuando cambia el tarifario publicado.',
      },
      {
        type: 'p',
        text: 'Mostramos todas las filas del filtro (incluye planes IOL Gold/Platinum/Black e IEB+ Investor/Rookie), sin deduplicar por entidad. Ordenamos por menor comisión publicada; si hay tasaAnualEquivalente (p. ej. cauciones), esa es la clave principal de orden. La membresía mensual condicional (membresiaMensual) aparece en cada fila cuando aplica — no es comisión por operación.',
      },
      {
        type: 'p',
        text: 'Marcamos tope cuando la fuente publica “hasta X%”, e IVA adicional cuando el arancel no lo incluye. El derecho de mercado y el mínimo pueden alterar el costo final; siempre conviene contrastar con el tarifario oficial del broker.',
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
      {
        type: 'formula',
        text: 'TEM = (1 + TIR)^(30 ÷ 365) − 1',
      },
      {
        type: 'p',
        text: 'La TEM es la tasa efectiva mensual implícita (base 30 días) derivada de la TIR. En la curva podés alternar TIR vs TEM.',
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
          'Patrimonio FCI en USD: mostramos el monto en dólares y el equivalente en ARS con el dólar bolsa (MEP, venta) de dolarapi.com. En vistas de administradoras/depositarias sumamos todo en ARS para poder comparar gestoras.',
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
    id: 'comisiones-cobro',
    title: 'Comisiones de cobro',
    category: 'otros',
    categoryLabel: 'Otros productos',
    source: 'Argentina Datos / fuentes oficiales',
    blocks: [
      {
        type: 'p',
        text: 'Comparamos aranceles (MDR) de cobro publicados por adquirentes y billeteras: Getnet, Mercado Pago, Ualá Bis, Payway, Banco Provincia, Fiserv, Nave, Openpay, Viumi, +Pagos Nación, Naranja X, Bezza Pay y Sipago. Los valores vienen de Argentina Datos (/v1/finanzas/cobros/comisiones) y se actualizan mensualmente.',
      },
      {
        type: 'p',
        text: 'El arancel se muestra en porcentaje. Si la fuente dice “hasta X%”, marcamos tope. Si dice “+ IVA” o que el costo no incluye IVA, mostramos el badge correspondiente. Podés filtrar por canal (POS, QR, link, checkout), medio de pago y tipo de acreditación.',
      },
      {
        type: 'p',
        text: 'El simulador estima el costo de cobro sobre un monto de venta: costo = monto × arancel (+ IVA 21% si el arancel lo indica y dejás activada la opción). El neto es el monto menos ese costo. Los aranceles “hasta X%” usan el tope publicado. Al simular, la tabla se ordena por menor costo.',
      },
      {
        type: 'formula',
        text: 'costo = monto × arancel × (1 + 0,21 si + IVA)',
      },
      {
        type: 'formula',
        text: 'neto = monto − costo',
      },
      {
        type: 'p',
        text: 'Mercado Pago publica costos por provincia; usamos el primer grupo provincial de cada tabla como referencia.',
      },
    ],
  },
  {
    id: 'prestamos-personales',
    title: 'Préstamos personales',
    category: 'otros',
    categoryLabel: 'Otros productos',
    blocks: [
      {
        type: 'p',
        text: 'Relevamos TNA, TEA y CFT TEA desde las landings oficiales de cada entidad, junto con condiciones (cliente, paquete, plan sueldo, etc.) y, cuando se publica, afectación de ingresos o un rango de tasas según evaluación crediticia.',
      },
      {
        type: 'p',
        text: 'El simulador estima la cuota con sistema francés: tasa mensual = TNA/12. También muestra una cuota de referencia usando la tasa mensual efectiva del CFT TEA, que incorpora IVA y cargos. Si cargás ingresos y hay afectación publicada, marcamos cuando la cuota supera ese tope.',
      },
      {
        type: 'p',
        text: 'Comparamos el CFT TEA de la mejor oferta con la mediana de inflación esperada a 12 meses del REM (BCRA), vía Argentina Datos (/v1/finanzas/rem/ultimo). El múltiplo CFT÷REM dimensiona cuánto más cara es la financiación respecto de la inflación esperada.',
      },
      {
        type: 'formula',
        text: 'múltiplo = CFT TEA ÷ REM mediana (próx. 12 meses)',
      },
      {
        type: 'formula',
        text: 'r = TNA / 12',
      },
      {
        type: 'formula',
        text: 'cuota = P × [r × (1+r)^n] / [(1+r)^n − 1]',
      },
      {
        type: 'p',
        text: 'Opcionalmente podés cargar ingresos netos mensuales del hogar para ver la relación cuota/ingreso y el ingreso mínimo requerido para no superar el tope orientativo del BCRA (~30%). Bandas: menos de 20% óptimo, 20–30% aceptable, 30–40% alerta, más de 40% riesgo.',
      },
      {
        type: 'formula',
        text: 'relación = cuota ÷ ingreso neto × 100',
      },
      {
        type: 'formula',
        text: 'ingreso requerido ≈ cuota ÷ 0,30',
      },
      {
        type: 'p',
        text: 'También es opcional el aumento salarial esperado (anual, semestral o trimestral) para proyectar esa relación año a año con cuota fija en pesos. El escenario de estrés deja el ingreso sin aumentos. Si hay REM, deflactamos la cuota a poder de compra de hoy para comparar.',
      },
      {
        type: 'p',
        text: 'Además mostramos techos BCRA (TEA/CFT máximos del CSV PERSONALES) solo para entidades del ranking, priorizando territorio nacional y productos generales. Son máximos regulatorios, no las tasas publicitadas del listado principal.',
      },
      {
        type: 'p',
        text: 'Es un dato informativo sujeto a aprobación crediticia; el banco puede usar otra amortización, seguros o comisiones no reflejadas en la TNA publicada.',
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
