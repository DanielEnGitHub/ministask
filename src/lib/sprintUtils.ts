import type { Sprint } from './types'

/**
 * Determina el sprint "actual" basándose en fechas y estado.
 * Prioridad:
 * 1. Sprint activo cuyas fechas incluyen hoy (en curso)
 * 2. Sprint activo vencido más reciente (end_date < hoy)
 * 3. Sprint activo futuro más cercano (start_date > hoy)
 * 4. null si no hay sprints activos
 */
export function getCurrentSprint(sprints: Sprint[]): Sprint | null {
  const activeSprints = sprints.filter(s => s.status === 'active')
  if (activeSprints.length === 0) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Sprint en curso (start_date <= hoy <= end_date)
  const inProgress = activeSprints.find(s => {
    const start = new Date(s.start_date)
    const end = new Date(s.end_date)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return start <= today && today <= end
  })
  if (inProgress) return inProgress

  // 2. Vencido más reciente (end_date < hoy, ordenar desc por end_date)
  const overdue = activeSprints
    .filter(s => {
      const end = new Date(s.end_date)
      end.setHours(23, 59, 59, 999)
      return end < today
    })
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())

  if (overdue.length > 0) return overdue[0]

  // 3. Futuro más cercano (start_date > hoy, ordenar asc por start_date)
  const future = activeSprints
    .filter(s => {
      const start = new Date(s.start_date)
      start.setHours(0, 0, 0, 0)
      return start > today
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  if (future.length > 0) return future[0]

  return null
}

/**
 * Verifica si un sprint está vencido (activo pero con fecha de fin pasada)
 */
export function isSprintOverdue(sprint: Sprint): boolean {
  if (sprint.status !== 'active') return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(sprint.end_date)
  end.setHours(23, 59, 59, 999)

  return end < today
}
