import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay } from 'date-fns'
import type { Task, RecurrenceConfig } from './types'

/**
 * Genera instancias de tareas recurrentes basadas en la configuración de recurrencia
 */
export function generateRecurringTasks(parentTask: Task, untilDate: Date): Partial<Task>[] {
  if (!parentTask.recurrence || !parentTask.startDate) {
    return []
  }

  const tasks: Partial<Task>[] = []
  const config = parentTask.recurrence
  let currentDate = new Date(parentTask.startDate)
  const endDate = parentTask.endDate ? new Date(parentTask.endDate) : currentDate
  const duration = endDate.getTime() - currentDate.getTime()

  let occurrenceCount = 0
  const maxOccurrences = config.endAfterOccurrences || 100 // límite de seguridad

  while (occurrenceCount < maxOccurrences) {
    // Calcular siguiente fecha basada en frecuencia
    currentDate = getNextOccurrence(currentDate, config, occurrenceCount)

    // Verificar si hemos pasado la fecha límite
    if (config.endDate && isAfter(currentDate, new Date(config.endDate))) {
      break
    }

    if (isAfter(currentDate, untilDate)) {
      break
    }

    occurrenceCount++

    // Verificar si hemos alcanzado el número máximo de ocurrencias
    if (config.endAfterOccurrences && occurrenceCount >= config.endAfterOccurrences) {
      break
    }

    // Si es semanal, verificar que el día de la semana esté en la lista
    if (config.frequency === 'weekly' && config.daysOfWeek && config.daysOfWeek.length > 0) {
      const dayOfWeek = currentDate.getDay()
      if (!config.daysOfWeek.includes(dayOfWeek)) {
        continue
      }
    }

    // Crear nueva instancia de la tarea
    const newTaskStartDate = new Date(currentDate)
    const newTaskEndDate = duration > 0 ? new Date(currentDate.getTime() + duration) : new Date(currentDate)

    tasks.push({
      title: parentTask.title,
      description: parentTask.description,
      status: 'created',
      subtasks: parentTask.subtasks.map(st => ({ ...st, id: Date.now().toString() + Math.random(), completed: false })),
      startDate: newTaskStartDate,
      endDate: newTaskEndDate,
      projectId: parentTask.projectId,
      sprintId: parentTask.sprintId,
      isRecurring: false,
      recurrence: null,
      parentTaskId: parentTask.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return tasks
}

function getNextOccurrence(currentDate: Date, config: RecurrenceConfig, iteration: number): Date {
  const { frequency, interval } = config

  switch (frequency) {
    case 'daily':
      return addDays(currentDate, interval)

    case 'weekly':
      if (iteration === 0) return currentDate // Primera ocurrencia

      // Si hay días específicos, encontrar el siguiente día válido
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        let nextDate = addDays(currentDate, 1)
        const maxAttempts = 7 * interval
        let attempts = 0

        while (attempts < maxAttempts) {
          const dayOfWeek = nextDate.getDay()
          if (config.daysOfWeek.includes(dayOfWeek)) {
            return nextDate
          }
          nextDate = addDays(nextDate, 1)
          attempts++
        }
      }

      return addWeeks(currentDate, interval)

    case 'monthly':
      return addMonths(currentDate, interval)

    default:
      return currentDate
  }
}

/**
 * Verifica si necesitamos generar nuevas instancias de tareas recurrentes
 * y las crea en la base de datos
 */
export async function checkAndGenerateRecurringTasks(
  tasks: Task[],
  saveTask: (task: Partial<Task>) => Promise<void>
): Promise<void> {
  const recurringTasks = tasks.filter(t => t.isRecurring && t.recurrence && !t.parentTaskId)
  const lookAheadDays = 90 // Generar tareas para los próximos 90 días
  const untilDate = addDays(new Date(), lookAheadDays)

  for (const parentTask of recurringTasks) {
    // Obtener instancias ya generadas
    const existingInstances = tasks.filter(t => t.parentTaskId === parentTask.id)

    // Encontrar la última fecha generada
    let lastGeneratedDate = parentTask.startDate ? new Date(parentTask.startDate) : new Date()
    if (existingInstances.length > 0) {
      const dates = existingInstances
        .filter(t => t.startDate)
        .map(t => new Date(t.startDate!))
      if (dates.length > 0) {
        lastGeneratedDate = new Date(Math.max(...dates.map(d => d.getTime())))
      }
    }

    // Solo generar si la última fecha es anterior a nuestro horizonte
    if (isBefore(lastGeneratedDate, untilDate)) {
      const newInstances = generateRecurringTasks(parentTask, untilDate)

      // Filtrar las que ya existen
      const instancesToCreate = newInstances.filter(newTask => {
        if (!newTask.startDate) return false

        return !existingInstances.some(existing => {
          if (!existing.startDate) return false
          return startOfDay(new Date(existing.startDate)).getTime() ===
                 startOfDay(new Date(newTask.startDate!)).getTime()
        })
      })

      // Crear las nuevas instancias
      for (const instance of instancesToCreate) {
        await saveTask(instance)
      }
    }
  }
}
