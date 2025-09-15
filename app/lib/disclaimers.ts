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
      text: 'Solo Uala (UILO), Brubank y Naranja X son cuentas remuneradas, el resto son fondos comunes de inversion. La tasa que se muestra en cocos corresponde al fondo cocos daruma renta mixta (COCORMA), este fondo podría llegar a tener un rendimiento negativo.',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  'mercado-dinero-ars': [
    {
      text: 'El rendimiento de los fondos comunes money market en pesos esta calculado con los ultimos dos valores cuotaparte reportados por la camara argentina de fondos comunes de inversion (CAFCI)',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  'renta-fija-usd': [
    {
      text: 'El rendimiento de los fondos en USD es calculado con los valores cuotaparte de los ultimos 30 dias segun la camara argentina de fondos comunes de inversion (CAFCI)',
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
      text: 'El rendimiento de los fondos money market en USD es calculado con los valores cuotaparte de los ultimos 2 dias segun la camara argentina de fondos comunes de inversion (CAFCI)',
    },
    {
      text: 'La información representada proviene de la camara argentina de fondos comunes de inversion (CAFCI) y de las propias plataformas. Puede llegar a estar desactualizada y no garantizamos que estos sean los ultimos rendimientos vigentes.',
    },
  ],
  stocks: [
    {
      text: 'El rendimiento de los fondos de acciones es calculado YTD con la variación en el valor de las cuotapartes desde el 30 de Diciembre a hoy.',
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
      text: 'Las tasas de plazos fijos corresponden a la TNA para plazos fijos a 30 días para clientes. La información puede estar desactualizada y no garantizamos que estas sean las últimas tasas vigentes.',
    },
  ],
  criptomonedas: [
    {
      text: 'Los rendimientos crypto representan el APY (Annual Percentage Yield) ofrecido por cada plataforma. Estos rendimientos pueden variar y no garantizamos que estos sean los últimos rendimientos vigentes.',
    },
  ],
}

export function getDisclaimers(tabId: string): string[] {
  const globalDisclaimers = disclaimerMappings.global?.map((d) => d.text) || []
  const tabDisclaimers =
    tabId === 'global' ? [] : disclaimerMappings[tabId]?.map((d) => d.text) || []
  return [...globalDisclaimers, ...tabDisclaimers]
}
