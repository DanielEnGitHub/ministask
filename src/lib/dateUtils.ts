/**
 * Utilidades para manejar fechas sin problemas de timezone
 *
 * El problema: cuando guardamos una fecha como "2025-10-21" (sin hora),
 * JavaScript la interpreta como UTC medianoche. Al convertirla a hora local,
 * puede restar horas según tu zona horaria, resultando en "2025-10-20".
 */

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs de tipo date
 */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha para mostrarla al usuario, evitando problemas de timezone
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)

  // Crear una fecha en hora local ignorando timezone
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  return localDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Normaliza una fecha a medianoche hora local (ignora timezone)
 * Útil para comparaciones de fechas
 */
export function normalizeDate(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
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
