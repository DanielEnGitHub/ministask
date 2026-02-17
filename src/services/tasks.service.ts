/**
 * =====================================================
 * SERVICIO: Tareas
 * =====================================================
 * Maneja todas las operaciones CRUD de tareas en Supabase
 * =====================================================
 */

import { supabase } from '@/lib/supabase'
import type { TaskStatus, TaskLabel, TaskPriority } from '@/lib/types'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  label: TaskLabel | null
  priority: TaskPriority | null
  project_id: string | null
  sprint_id: string | null
  start_date: string | null
  end_date: string | null
  subtasks: any[] | null
  task_views: any[] | null
  images: string[] | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  label?: TaskLabel
  priority?: TaskPriority
  projectId?: string
  sprintId?: string | null
  startDate?: Date
  endDate?: Date
  subtasks?: any[]
  images?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  label?: TaskLabel
  priority?: TaskPriority
  projectId?: string
  sprintId?: string | null
  startDate?: Date
  endDate?: Date
  subtasks?: any[]
  images?: string[]
}

/**
 * Obtener todas las tareas
 * Admin: Ve todas las tareas
 * Client: Solo ve tareas de proyectos asignados
 */
export async function getAllTasks(userId: string, isAdmin: boolean) {
  try {
    if (isAdmin) {
      // Admin ve todas las tareas
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } else {
      // Cliente solo ve tareas de proyectos asignados
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(
            id,
            project_assignments!inner(user_id)
          )
        `)
        .eq('projects.project_assignments.user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('[getAllTasks] Error:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una tarea por ID
 */
export async function getTaskById(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getTaskById] Error:', error)
    return { data: null, error }
  }
}

/**
 * Crear una nueva tarea
 * Admin: Puede crear en cualquier proyecto
 * Client: Solo en proyectos asignados
 */
export async function createTask(input: CreateTaskInput, userId: string) {
  try {
    // Generar UUID válido
    const id = crypto.randomUUID()

    const task: Omit<Task, 'created_at' | 'updated_at'> = {
      id,
      title: input.title,
      description: input.description || null,
      status: input.status || 'created',
      label: input.label || null,
      priority: input.priority || null,
      project_id: input.projectId || null,
      sprint_id: input.sprintId || null,
      start_date: input.startDate ? input.startDate.toISOString() : null,
      end_date: input.endDate ? input.endDate.toISOString() : null,
      subtasks: input.subtasks || null,
      task_views: null,
      images: input.images || null,
      created_by: userId,
    }

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[createTask] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar una tarea
 * Solo admin puede actualizar tareas
 */
export async function updateTask(taskId: string, input: UpdateTaskInput) {
  try {
    const updates: any = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    // Convertir nombres de campos de camelCase a snake_case
    if (input.projectId !== undefined) {
      updates.project_id = input.projectId
      delete updates.projectId
    }
    if (input.sprintId !== undefined) {
      updates.sprint_id = input.sprintId || null
      delete updates.sprintId
    }
    if (input.startDate !== undefined) {
      updates.start_date = input.startDate ? input.startDate.toISOString() : null
      delete updates.startDate
    }
    if (input.endDate !== undefined) {
      updates.end_date = input.endDate ? input.endDate.toISOString() : null
      delete updates.endDate
    }
    if (input.images !== undefined) {
      updates.images = input.images
    }

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[updateTask] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar solo el estado de una tarea
 * Solo admin puede cambiar estados
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  try {
    // @ts-ignore - Supabase generated types issue
    const { data, error} = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[updateTaskStatus] Error:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar una tarea
 * Solo admin puede eliminar tareas
 */
export async function deleteTask(taskId: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[deleteTask] Error:', error)
    return { error }
  }
}

/**
 * Obtener tareas por proyecto
 */
export async function getTasksByProject(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getTasksByProject] Error:', error)
    return { data: null, error }
  }
}

/**
 * Obtener tareas por sprint
 */
export async function getTasksBySprint(sprintId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getTasksBySprint] Error:', error)
    return { data: null, error }
  }
}

/**
 * Registrar una vista de tarea
 * Solo se registra si el usuario NO es admin
 * Usa RPC para evitar problemas con RLS
 */
export async function recordTaskView(taskId: string, userId: string, userName: string) {
  try {
    const { data, error } = await supabase.rpc('record_task_view', {
      task_id_param: taskId,
      user_id_param: userId,
      user_name_param: userName
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
