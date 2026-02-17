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
  if (task.start_date !== undefined && task.start_date !== null) {
    return task.start_date
  }
  if (task.startDate !== undefined && task.startDate !== null) {
    return task.startDate
  }
  return null
}

/**
 * Obtiene la fecha de fin de una tarea
 * Maneja tanto camelCase (endDate) como snake_case (end_date)
 */
export function getTaskEndDate(task: any): Date | string | null {
  if (task.end_date !== undefined && task.end_date !== null) {
    return task.end_date
  }
  if (task.endDate !== undefined && task.endDate !== null) {
    return task.endDate
  }
  return null
}

/**
 * Obtiene el ID del proyecto de una tarea
 * Maneja tanto camelCase (projectId) como snake_case (project_id)
 */
export function getTaskProjectId(task: any): string | null | undefined {
  // Verificar project_id (snake_case de Supabase)
  if (task.project_id !== undefined && task.project_id !== null) {
    return task.project_id
  }
  // Verificar projectId (camelCase)
  if (task.projectId !== undefined && task.projectId !== null) {
    return task.projectId
  }
  return undefined
}

/**
 * Obtiene la etiqueta de una tarea
 * Maneja tanto camelCase (label) como otros formatos posibles
 */
export function getTaskLabel(task: any): string | null | undefined {
  if (task.label !== undefined && task.label !== null) {
    return task.label
  }
  return null
}

/**
 * Obtiene el ID del sprint de una tarea
 * Maneja tanto camelCase (sprintId) como snake_case (sprint_id)
 */
export function getTaskSprintId(task: any): string | null | undefined {
  if (task.sprint_id !== undefined && task.sprint_id !== null) {
    return task.sprint_id
  }
  if (task.sprintId !== undefined && task.sprintId !== null) {
    return task.sprintId
  }
  return null
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
