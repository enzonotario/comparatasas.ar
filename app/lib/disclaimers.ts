export interface Disclaimer {
  text: string
}

export interface DisclaimerMapping {
  [key: string]: Disclaimer[]
}

export const disclaimerMappings: DisclaimerMapping = {
  global: [
    {
      text: 'El propósito de este proyecto es difundir e informar sobre distintas alternativas de inversion pero no pretende en ningun caso asesorar o recomendar sobre las alternativas representadas. No todas las opciones aquí representadas conllevan el mismo riesgo. Hace tu propia investigación a la hora de invertir.',
    },
  ],
  'cuentas-billeteras': [
    {
      text: 'Las tasas de rendimiento garantizado provienen directamente de las plataformas y representan la TNA (Tasa Nominal Anual) ofrecida por cada entidad.',
    },
    {
      text: 'El rendimiento de los fondos comunes de inversion (rendimiento variable) se calcula comparando los ultimos dos valores cuotaparte reportados por la camara argentina de fondos comunes de inversion (CAFCI). La TNA se obtiene anualizando el rendimiento diario entre ambas fechas.',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  'renta-fija-usd': [
    {
      text: 'El rendimiento de los fondos en USD se calcula comparando los valores cuotaparte de hace 30 dias con el ultimo valor disponible segun la camara argentina de fondos comunes de inversion (CAFCI). La TNA se obtiene anualizando el rendimiento del periodo de 30 dias.',
    },
    {
      text: 'Algunos de los fondos aqui representados suelen tener rendimientos diarios negativos. Investiga por tu cuenta antes de invertir. No todos tienen el mismo riesgo.',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  'mercado-dinero-usd': [
    {
      text: 'El rendimiento de los fondos money market en USD se calcula comparando los ultimos dos valores cuotaparte reportados por la camara argentina de fondos comunes de inversion (CAFCI). La TNA se obtiene anualizando el rendimiento diario entre ambas fechas.',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  stocks: [
    {
      text: 'El rendimiento de los fondos de acciones se calcula YTD (Year To Date) comparando la variación en el valor de las cuotapartes desde el 30 de Diciembre hasta la fecha actual. La TNA se obtiene anualizando este rendimiento.',
    },
    {
      text: 'Los fondos de acciones suelen tener rendimientos diarios negativos. Investiga por tu cuenta antes de invertir. Son fondos de alto riesgo.',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  'plazos-fijos': [
    {
      text: 'Las tasas de plazos fijos corresponden a la TNA para plazos fijos a 30 días para clientes informados al BCRA. La información puede estar desactualizada y/o no reflejar la realidad. Verificá siempre las condiciones actuales directamente con cada institución antes de invertir.',
    },
  ],
  criptomonedas: [
    {
      text: 'Los rendimientos crypto representan el APY (Annual Percentage Yield) ofrecido por cada plataforma. Estos rendimientos pueden variar y no garantizamos que estos sean los últimos rendimientos vigentes.',
    },
  ],
  criptopesos: [
    {
      text: 'Las tasas de criptopesos provienen directamente de las plataformas y representan la TNA (Tasa Nominal Anual) ofrecida por cada entidad para sus tokens.',
    },
    {
      text: 'La información representada proviene de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
}

export function getDisclaimers(tabId: string): string[] {
  const globalDisclaimers = disclaimerMappings.global?.map((d) => d.text) || []
  const tabDisclaimers =
    tabId === 'global' ? [] : disclaimerMappings[tabId]?.map((d) => d.text) || []
  return [...globalDisclaimers, ...tabDisclaimers]
}
