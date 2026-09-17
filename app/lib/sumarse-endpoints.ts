export type EndpointTab =
  | 'plazos-fijos'
  | 'plazos-fijos-uva-periodico'
  | 'plazos-fijos-uva-precancelable'
  | 'fondos-comunes'
  | 'cuentas-billeteras'
  | 'usd'
  | 'criptopesos'
  | 'criptomonedas'
  | 'remesas'
  | 'hipotecarios-uva'
  | 'prestamos-personales'
  | 'comisiones-cobro'

export interface EndpointField {
  name: string
  description: string
}

export interface EndpointSpec {
  id: EndpointTab
  label: string
  description: string
  example: string
  fields: EndpointField[]
  notes?: string[]
}

export const SUMARSE_DEFAULT_ENDPOINT: EndpointTab = 'plazos-fijos'

export const endpointSpecs: EndpointSpec[] = [
  {
    id: 'plazos-fijos',
    label: 'Plazos Fijos',
    description:
      'Tasas de plazos fijos tradicionales. Las TNA van en decimal (0.45 = 45%). Podés informar una TNA raíz y/o tramos por monto y plazo.',
    example: `[
  {
    "entidad": "BANCO XYZ",
    "tnaClientes": 0.45,
    "tnaNoClientes": 0.40,
    "fecha": "2026-08-12",
    "enlace": "https://www.banco.example/plazos-fijos",
    "logo": "https://cdn.example/logo.png",
    "condiciones": "Solo para clientes con cuenta sueldo",
    "condicionesCorto": "Clientes",
    "tasas": [
      {
        "montoMinimo": 0,
        "montoMaximo": 1000000,
        "plazoMinDias": 30,
        "plazoMaxDias": 30,
        "tna": 0.42
      },
      {
        "montoMinimo": 1000000,
        "montoMaximo": null,
        "plazoMinDias": 30,
        "plazoMaxDias": 90,
        "tna": 0.45
      }
    ]
  }
]`,
    fields: [
      { name: 'entidad', description: 'nombre de la entidad' },
      { name: 'tnaClientes', description: 'TNA en decimal para clientes' },
      { name: 'tnaNoClientes', description: 'TNA en decimal para no clientes (o null)' },
      { name: 'fecha', description: 'fecha de vigencia (YYYY-MM-DD)' },
      { name: 'enlace', description: 'URL pública del producto' },
      { name: 'logo', description: 'URL del isologo (opcional)' },
      { name: 'condiciones / condicionesCorto', description: 'texto libre (opcional)' },
      {
        name: 'tasas[]',
        description: 'tramos opcionales: montoMinimo, montoMaximo, plazoMinDias, plazoMaxDias, tna',
      },
    ],
  },
  {
    id: 'plazos-fijos-uva-periodico',
    label: 'PF UVA periódico',
    description:
      'Plazos fijos UVA con pago periódico de intereses. Un proveedor puede publicar varios tramos de plazo.',
    example: `[
  {
    "id": "banco-xyz-uva-periodico",
    "entidad": "BANCO XYZ",
    "logo": "https://cdn.example/logo.png",
    "tasas": [
      {
        "nombre": "UVA pago periódico",
        "plazoMinDias": 90,
        "plazoMaxDias": 365,
        "tna": 0.01,
        "tea": 0.01005
      }
    ]
  }
]`,
    fields: [
      { name: 'id', description: 'identificador estable del proveedor' },
      { name: 'entidad', description: 'nombre de la entidad' },
      { name: 'logo', description: 'URL del isologo' },
      {
        name: 'tasas[]',
        description: 'tramos: nombre, plazoMinDias, plazoMaxDias, tna, tea (decimales)',
      },
    ],
  },
  {
    id: 'plazos-fijos-uva-precancelable',
    label: 'PF UVA precancelable',
    description:
      'Plazos fijos UVA precancelables. Incluí TNA a vencimiento y, si aplica, TNA/TEA de precancelación.',
    example: `[
  {
    "id": "banco-xyz-uva-precancelable",
    "entidad": "BANCO XYZ",
    "logo": "https://cdn.example/logo.png",
    "enlace": "https://www.banco.example/uva-precancelable",
    "canal": "Sucursal / Home banking",
    "moneda": "ARS",
    "plazoMinDias": 90,
    "plazoMaxDias": 365,
    "plazoPrecancelacionDias": 30,
    "avisoPrecancelacionDias": 5,
    "montoMinimo": 1000,
    "montoMaximo": null,
    "modalidad": "UVA + TNA",
    "tna": 0.01,
    "tea": 0.01005,
    "tnaPrecancelacion": 0.005,
    "teaPrecancelacion": 0.00501
  }
]`,
    fields: [
      { name: 'entidad / logo / enlace', description: 'datos del proveedor' },
      { name: 'plazoMinDias / plazoMaxDias', description: 'rango de plazo en días' },
      {
        name: 'plazoPrecancelacionDias / avisoPrecancelacionDias',
        description: 'reglas de precancelación (o null)',
      },
      { name: 'montoMinimo / montoMaximo', description: 'límites de monto (o null)' },
      {
        name: 'tna / tea / tnaPrecancelacion / teaPrecancelacion',
        description: 'tasas en decimal',
      },
    ],
  },
  {
    id: 'fondos-comunes',
    label: 'Fondos Comunes',
    description:
      'Datos de FCI para rankings curados (cuentas/home). El catálogo completo de /fondos se alimenta principalmente desde CNV; este formato sirve para mapear tu producto a un fondo.',
    example: `[
  {
    "fondo": "FCI ABC Clase A",
    "horizonte": "Corto Plazo",
    "fecha": "2026-08-12",
    "vcp": 1234.56,
    "ccp": 1230.45,
    "patrimonio": 1000000000,
    "tipoRenta": "Mercado de Dinero"
  }
]`,
    fields: [
      { name: 'fondo', description: 'nombre del fondo / clase' },
      { name: 'horizonte', description: 'horizonte de inversión' },
      { name: 'fecha', description: 'fecha del último cierre (YYYY-MM-DD)' },
      { name: 'vcp', description: 'valor cuotaparte' },
      { name: 'ccp', description: 'cantidad de cuotapartes (opcional)' },
      { name: 'patrimonio', description: 'patrimonio del fondo' },
      { name: 'tipoRenta', description: 'Mercado de Dinero, Renta Fija, etc. (opcional)' },
    ],
    notes: [
      'Si tu producto remunera con un FCI existente, también alcanza con indicarnos el nombre exacto del fondo y el enlace a tu app.',
    ],
  },
  {
    id: 'cuentas-billeteras',
    label: 'Cuentas y Billeteras',
    description:
      'Rendimiento de cuentas remuneradas y billeteras en ARS. TNA/TEA en decimal. Usá tope null si no hay límite.',
    example: `[
  {
    "fondo": "ABC Remunerada",
    "tna": 0.35,
    "tea": 0.417,
    "tope": 1000000,
    "fecha": "2026-08-12",
    "condiciones": "Solo clientes con cuenta sueldo",
    "condicionesCorto": "Clientes",
    "plazoMinDias": null,
    "plazoMaxDias": null
  }
]`,
    fields: [
      { name: 'fondo', description: 'nombre del producto' },
      { name: 'tna', description: 'TNA en decimal (0.35 = 35%)' },
      { name: 'tea', description: 'TEA en decimal (opcional)' },
      { name: 'tope', description: 'monto máximo remunerado, o null' },
      { name: 'fecha', description: 'fecha de vigencia (opcional)' },
      { name: 'condiciones / condicionesCorto', description: 'texto libre (opcional)' },
      {
        name: 'plazoMinDias / plazoMaxDias',
        description: 'si el producto tiene tramos de plazo (p. ej. frascos)',
      },
    ],
  },
  {
    id: 'usd',
    label: 'USD',
    description:
      'Cuentas remuneradas en dólares. La tasa va en decimal. Para billeteras USD también podés usar el formato de Criptomonedas con moneda "USD".',
    example: `[
  {
    "entidad": "Proveedor XYZ",
    "tasa": 0.04,
    "tope": 10000
  }
]`,
    fields: [
      { name: 'entidad', description: 'nombre del proveedor' },
      { name: 'tasa', description: 'TNA en decimal (0.04 = 4%)' },
      { name: 'tope', description: 'tope en USD (0 o el monto máximo)' },
    ],
    notes: [
      'Billeteras USD: podés enviar el mismo schema de Criptomonedas con `"moneda": "USD"` y `apy` en porcentaje (p. ej. 4 = 4%).',
    ],
  },
  {
    id: 'criptopesos',
    label: 'Criptopesos',
    description: 'Tokens en pesos (USDT/DAI/etc. atados a ARS). TNA en decimal.',
    example: `[
  {
    "token": "USDT",
    "entidad": "ABC",
    "tna": 0.25
  }
]`,
    fields: [
      { name: 'token', description: 'ticker del token (USDT, DAI, etc.)' },
      { name: 'entidad', description: 'nombre de la plataforma' },
      { name: 'tna', description: 'TNA en decimal' },
    ],
  },
  {
    id: 'criptomonedas',
    label: 'Criptomonedas',
    description:
      'APY de staking / earn por moneda. El `apy` se informa en porcentaje (12 = 12%), no en decimal.',
    example: `[
  {
    "entidad": "ABC",
    "rendimientos": [
      { "moneda": "USDT", "apy": 12 },
      { "moneda": "USDC", "apy": 10 },
      { "moneda": "USD", "apy": 4 }
    ]
  }
]`,
    fields: [
      { name: 'entidad', description: 'nombre de la plataforma' },
      { name: 'rendimientos[].moneda', description: 'ticker (USDT, BTC, USD, …)' },
      { name: 'rendimientos[].apy', description: 'APY en porcentaje (12 = 12%)' },
    ],
  },
  {
    id: 'remesas',
    label: 'Remesas',
    description:
      'Proveedores de recepción de pagos / remesas desde el exterior. Los costos van como texto libre (podés aclarar en `detalles`).',
    example: `[
  {
    "compania": "Proveedor XYZ",
    "cuentaPropia": true,
    "moneda": "FIAT",
    "inversiones": true,
    "tarjetaUsa": false,
    "costoRecibirPagos": "0%",
    "costoMantenimientoTarjeta": "0 USD",
    "costoTarjeta": "0%",
    "retiroArs": "0%",
    "calificacionAndroid": 4.5,
    "calificacionIos": 4.7,
    "detalles": {
      "cuentaPropia": "CBU propio a nombre del usuario",
      "moneda": "También permite saldo en USD",
      "inversiones": "Solo para residentes en Argentina",
      "costoRecibirPagos": "Sin costo vía ACH",
      "retiroArs": "Puede variar según banco o método"
    }
  }
]`,
    fields: [
      { name: 'compania', description: 'nombre del proveedor' },
      {
        name: 'cuentaPropia / inversiones / tarjetaUsa',
        description: 'booleanos de features',
      },
      { name: 'moneda', description: 'texto, p. ej. FIAT o CRIPTO' },
      {
        name: 'costoRecibirPagos / costoMantenimientoTarjeta / costoTarjeta / retiroArs',
        description: 'texto libre',
      },
      {
        name: 'detalles',
        description: 'objeto opcional con aclaraciones por columna',
      },
    ],
  },
  {
    id: 'hipotecarios-uva',
    label: 'Hipotecarios UVA',
    description:
      'TNA de referencia de créditos hipotecarios UVA. La TNA va en decimal (0.045 = 4,5%).',
    example: `[
  {
    "entidad": "BANCO XYZ",
    "nombreComercial": "Hipotecario UVA XYZ",
    "tna": 0.045,
    "metadata": {
      "plazo_max_anios": 30,
      "relacion_cuota_ingreso": "25%",
      "financiamiento": "Hasta 80% del valor"
    }
  }
]`,
    fields: [
      { name: 'entidad', description: 'nombre del banco' },
      { name: 'nombreComercial', description: 'nombre del producto' },
      { name: 'tna', description: 'TNA en decimal' },
      {
        name: 'metadata',
        description: 'opcional: plazo_max_anios, relacion_cuota_ingreso, financiamiento',
      },
    ],
  },
  {
    id: 'prestamos-personales',
    label: 'Préstamos personales',
    description:
      'Ofertas de préstamos personales desde landings. Tasas (TNA/TEA/CFT) en decimal. Podés incluir rangos o tramos por plazo en metadata.',
    example: `[
  {
    "entidad": "BANCO XYZ",
    "nombreComercial": "XYZ",
    "producto": "Préstamo personal online",
    "tna": 0.75,
    "tea": 1.05,
    "cftTna": 0.90,
    "cftTea": 1.25,
    "tipoTasa": "Fija",
    "moneda": "ARS",
    "requiereCliente": true,
    "condiciones": "Con cuenta sueldo",
    "enlace": "https://www.banco.example/prestamos",
    "vigenciaDesde": "2026-08-01",
    "vigenciaHasta": null,
    "metadata": {
      "afectacionIngresos": "30%",
      "plazoMinMeses": 6,
      "plazoMaxMeses": 48,
      "plazoMesesEjemplo": 12,
      "tasasPorPlazo": [
        {
          "plazoMinMeses": 6,
          "plazoMaxMeses": 12,
          "tna": 0.70,
          "tea": 0.95,
          "cftTea": 1.15
        }
      ]
    }
  }
]`,
    fields: [
      { name: 'entidad / nombreComercial / producto', description: 'identificación de la oferta' },
      { name: 'tna / tea / cftTna / cftTea', description: 'tasas en decimal (o null)' },
      { name: 'tipoTasa / moneda', description: 'p. ej. Fija / ARS' },
      { name: 'requiereCliente', description: 'boolean o null' },
      { name: 'condiciones / enlace', description: 'texto y URL pública' },
      { name: 'vigenciaDesde / vigenciaHasta', description: 'YYYY-MM-DD o null' },
      {
        name: 'metadata',
        description: 'opcional: afectación, plazos, rango de tasas, tasasPorPlazo[]',
      },
    ],
  },
  {
    id: 'comisiones-cobro',
    label: 'Comisiones de cobro',
    description:
      'Aranceles (MDR) de cobro por canal y medio de pago. El arancel va en decimal (0.029 = 2,9%).',
    example: `{
  "fechaActualizacion": "2026-08-01",
  "comisiones": [
    {
      "entidad": "Proveedor XYZ",
      "nombreComercial": "XYZ Cobros",
      "producto": "QR cuenta",
      "canal": "qr",
      "medioPago": "qr_cuenta",
      "arancel": 0.029,
      "arancelEsTope": false,
      "incluyeIva": false,
      "ivaAdicional": true,
      "acreditacionTipo": "estandar",
      "acreditacionPlazoHabiles": 1,
      "acreditacionLabel": "1 día hábil",
      "moneda": "ARS",
      "condiciones": null,
      "enlace": "https://www.proveedor.example/comisiones",
      "vigenciaDesde": "2026-08-01",
      "vigenciaHasta": null,
      "metadata": null
    }
  ]
}`,
    fields: [
      { name: 'entidad / nombreComercial / producto', description: 'identificación de la tarifa' },
      {
        name: 'canal',
        description: 'pos | qr | link | checkout | online | otro',
      },
      {
        name: 'medioPago',
        description: 'debito | credito | credito_cuotas | qr_cuenta | prepaga | amex | otro',
      },
      { name: 'arancel', description: 'decimal (0.029 = 2,9%)' },
      { name: 'arancelEsTope', description: 'true si es “hasta X%”' },
      { name: 'incluyeIva / ivaAdicional', description: 'booleanos de IVA' },
      {
        name: 'acreditacionTipo / acreditacionPlazoHabiles / acreditacionLabel',
        description: 'inmediata | anticipada | estandar | desconocida + plazo',
      },
      { name: 'enlace / vigenciaDesde / vigenciaHasta', description: 'URL y vigencia' },
    ],
  },
]

export const sumarseEndpointIds = endpointSpecs.map((spec) => spec.id)

export function getSumarseEndpoint(id: string): EndpointSpec | undefined {
  return endpointSpecs.find((spec) => spec.id === id)
}
