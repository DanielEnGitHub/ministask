/**
 * =====================================================
 * SERVICIO: Sprints
 * =====================================================
 * Maneja todas las operaciones CRUD de sprints en Supabase
 * =====================================================
 */

import { supabase } from '@/lib/supabase'

export interface Sprint {
  id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: 'active' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateSprintInput {
  name: string
  goal?: string
  startDate: string
  endDate: string
}

export interface UpdateSprintInput {
  name?: string
  goal?: string
  startDate?: string
  endDate?: string
}

/**
 * Obtener todos los sprints ordenados por fecha de inicio
 */
export async function getAllSprints() {
  try {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getAllSprints] Error:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo sprint
 * Solo admin puede crear sprints
 */
export async function createSprint(input: CreateSprintInput, userId: string) {
  try {
    const id = crypto.randomUUID()

    const sprint = {
      id,
      name: input.name,
      goal: input.goal || null,
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'active' as const,
      created_by: userId,
    }

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('sprints')
      .insert(sprint)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[createSprint] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un sprint
 * Solo admin puede actualizar sprints
 */
export async function updateSprint(sprintId: string, input: UpdateSprintInput) {
  try {
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) updates.name = input.name
    if (input.goal !== undefined) updates.goal = input.goal || null
    if (input.startDate !== undefined) updates.start_date = input.startDate
    if (input.endDate !== undefined) updates.end_date = input.endDate

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('sprints')
      .update(updates)
      .eq('id', sprintId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[updateSprint] Error:', error)
    return { data: null, error }
  }
}

/**
 * Completar un sprint:
 * 1. Marcar como 'completed'
 * 2. Desasignar tareas que NO estén en 'completed' ni 'cancelled'
 */
export async function completeSprint(sprintId: string) {
  try {
    // 1. Marcar sprint como completado
    // @ts-ignore - Supabase generated types issue
    const { data: sprintData, error: sprintError } = await supabase
      .from('sprints')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sprintId)
      .select()
      .single()

    if (sprintError) throw sprintError

    // 2. Desasignar tareas no finalizadas del sprint
    // @ts-ignore - Supabase generated types issue
    const { error: tasksError } = await supabase
      .from('tasks')
      .update({ sprint_id: null, updated_at: new Date().toISOString() })
      .eq('sprint_id', sprintId)
      .not('status', 'in', '("completed","cancelled")')

    if (tasksError) throw tasksError

    return { data: sprintData, error: null }
  } catch (error) {
    console.error('[completeSprint] Error:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un sprint
 * Desasigna todas las tareas del sprint antes de eliminar
 */
export async function deleteSprint(sprintId: string) {
  try {
    // Desasignar todas las tareas del sprint
    // @ts-ignore - Supabase generated types issue
    const { error: tasksError } = await supabase
      .from('tasks')
      .update({ sprint_id: null, updated_at: new Date().toISOString() })
      .eq('sprint_id', sprintId)

    if (tasksError) throw tasksError

    // Eliminar el sprint
    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', sprintId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[deleteSprint] Error:', error)
    return { error }
  }
}
