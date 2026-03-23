interface Holiday {
  fecha: string
  tipo: string
  nombre: string
}

const holidaysCache = new Map<number, string[]>()

export function useHolidays() {
  async function getHolidays(year: number): Promise<string[]> {
    if (holidaysCache.has(year)) {
      return holidaysCache.get(year)!
    }

    try {
      const data = await $fetch<Holiday[]>(`https://api.argentinadatos.com/v1/feriados/${year}`)
      const holidayDates = data.map((h) => h.fecha)
      holidaysCache.set(year, holidayDates)
      return holidayDates
    } catch (error) {
      console.error(`Error fetching holidays for year ${year}:`, error)
      return []
    }
  }

  /**
   * Obtiene la fecha de liquidación (T+X días hábiles)
   * @param from Fecha de inicio
   * @param settlementDays Días de liquidación (default T+1)
   * @returns Fecha de liquidación
   */
  async function getSettlementDate(from: Date, settlementDays: number = 1): Promise<Date> {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    let steps = 0
    let currentYear = d.getFullYear()
    let holidays = await getHolidays(currentYear)

    while (steps < settlementDays) {
      d.setDate(d.getDate() + 1)

      // Si cambiamos de año, recargar feriados
      if (d.getFullYear() !== currentYear) {
        currentYear = d.getFullYear()
        holidays = await getHolidays(currentYear)
      }

      const dow = d.getDay()
      if (dow === 0 || dow === 6) continue // Sábado o Domingo

      const iso = d.toISOString().split('T')[0]
      if (holidays.includes(iso)) continue // Feriado

      steps++
    }
    return d
  }

  return {
    getHolidays,
    getSettlementDate,
  }
}
