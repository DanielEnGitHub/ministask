/**
 * Utilidades para manejar fechas sin problemas de timezone
 *
 * El problema: cuando guardamos una fecha como "2025-10-21" (sin hora),
 * JavaScript la interpreta como UTC medianoche. Al convertirla a hora local,
 * puede restar horas según tu zona horaria, resultando en "2025-10-20".
 */

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs de tipo date
 * Usa UTC para evitar problemas de zona horaria
 */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha para mostrarla al usuario, evitando problemas de timezone
 * Usa UTC para extraer los componentes de la fecha y evitar desfase
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)

  // Usar UTC para extraer los componentes y evitar desfase por zona horaria
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')

  return `${day}/${month}/${year}`
}

/**
 * Normaliza una fecha a medianoche hora local (ignora timezone)
 * Útil para comparaciones de fechas
 */
export function normalizeDate(date: Date | string): Date {
  // Si es un string, intentamos parsearlo correctamente
  if (typeof date === 'string') {
    // Si es formato YYYY-MM-DD, lo parseamos directamente sin conversión UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    // Si es un string ISO completo, lo convertimos a Date y extraemos los componentes
    const d = new Date(date)
    // Extraer los componentes usando UTC para evitar desfase de timezone
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  // Si ya es un objeto Date
  const d = date
  // Usar UTC para evitar desfase por timezone
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * Compara si dos fechas son el mismo día (ignorando hora y timezone)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = normalizeDate(date1)
  const d2 = normalizeDate(date2)

  return d1.getTime() === d2.getTime()
}

/**
 * Verifica si una fecha está dentro de un rango (inclusive)
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = normalizeDate(date)
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)

  return d >= start && d <= end
}
