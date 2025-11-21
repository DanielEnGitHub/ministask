/**
 * =====================================================
 * UTILIDADES: Manejo de Tareas
 * =====================================================
 * Funciones auxiliares para manejar tareas y convertir
 * entre formatos camelCase y snake_case
 * =====================================================
 */

import type { Task } from './types'

/**
 * Obtiene la fecha de inicio de una tarea
 * Maneja tanto camelCase (startDate) como snake_case (start_date)
 */
export function getTaskStartDate(task: any): Date | string | null {
  return task.start_date || task.startDate || null
}

/**
 * Obtiene la fecha de fin de una tarea
 * Maneja tanto camelCase (endDate) como snake_case (end_date)
 */
export function getTaskEndDate(task: any): Date | string | null {
  return task.end_date || task.endDate || null
}

/**
 * Obtiene el ID del proyecto de una tarea
 * Maneja tanto camelCase (projectId) como snake_case (project_id)
 */
export function getTaskProjectId(task: any): string | undefined {
  return task.project_id || task.projectId || undefined
}

/**
 * Verifica si una tarea tiene fechas asignadas
 */
export function hasTaskDates(task: any): boolean {
  return !!(getTaskStartDate(task) || getTaskEndDate(task))
}

/**
 * Normaliza una tarea de Supabase al formato esperado por los componentes
 * Convierte snake_case a camelCase para compatibilidad
 */
export function normalizeTask(task: any): Task {
  return {
    ...task,
    startDate: getTaskStartDate(task),
    endDate: getTaskEndDate(task),
    projectId: getTaskProjectId(task),
  }
}

/**
 * Convierte un objeto Date a formato YYYY-MM-DD para inputs HTML
 * Maneja valores null/undefined
 */
export function getDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
