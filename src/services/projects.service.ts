/**
 * =====================================================
 * SERVICIO: Proyectos
 * =====================================================
 * Maneja todas las operaciones CRUD de proyectos en Supabase
 * =====================================================
 */

import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  created_by: string
  created_at: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  color?: string
}

/**
 * Obtener todos los proyectos
 * Admin: Ve todos los proyectos
 * Client: Solo ve proyectos asignados
 */
export async function getAllProjects(userId: string, isAdmin: boolean) {
  try {
    if (isAdmin) {
      // Admin ve todos los proyectos
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } else {
      // Cliente solo ve proyectos asignados
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments!inner(user_id)
        `)
        .eq('project_assignments.user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('[getAllProjects] Error:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un proyecto por ID
 */
export async function getProjectById(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getProjectById] Error:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo proyecto
 * Solo admin puede crear proyectos
 */
export async function createProject(input: CreateProjectInput, userId: string) {
  try {
    // Generar UUID válido
    const id = crypto.randomUUID()

    const project: Omit<Project, 'created_at'> = {
      id,
      name: input.name,
      description: input.description || null,
      color: input.color || '#3B82F6',
      created_by: userId,
    }

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[createProject] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un proyecto
 * Solo admin puede actualizar proyectos
 */
export async function updateProject(projectId: string, input: UpdateProjectInput) {
  try {
    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('projects')
      .update(input)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[updateProject] Error:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un proyecto
 * Solo admin puede eliminar proyectos
 */
export async function deleteProject(projectId: string) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[deleteProject] Error:', error)
    return { error }
  }
}

/**
 * Asignar un usuario a un proyecto
 * Solo admin puede asignar usuarios
 */
export async function assignUserToProject(projectId: string, userId: string) {
  try {
    // Generar UUID válido
    const id = crypto.randomUUID()

    // @ts-ignore - Supabase generated types issue
    const { data, error } = await supabase
      .from('project_assignments')
      .insert({
        id,
        project_id: projectId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[assignUserToProject] Error:', error)
    return { data: null, error }
  }
}

/**
 * Desasignar un usuario de un proyecto
 * Solo admin puede desasignar usuarios
 */
export async function unassignUserFromProject(projectId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('project_assignments')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[unassignUserFromProject] Error:', error)
    return { error }
  }
}

/**
 * Obtener usuarios asignados a un proyecto
 */
export async function getProjectAssignments(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .select(`
        *,
        profiles(*)
      `)
      .eq('project_id', projectId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getProjectAssignments] Error:', error)
    return { data: null, error }
  }
}
