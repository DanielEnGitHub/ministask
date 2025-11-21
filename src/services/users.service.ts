/**
 * =====================================================
 * SERVICIO: Usuarios
 * =====================================================
 * Maneja operaciones de gestión de usuarios y perfiles
 * Solo admin puede gestionar usuarios
 * =====================================================
 */

import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

export interface UserWithAssignments extends Profile {
  project_count?: number
  assigned_projects?: Array<{
    id: string
    project_id: string
    project_name: string
  }>
}

/**
 * Obtener todos los usuarios con sus perfiles
 * Solo admin puede ver todos los usuarios
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        project_assignments!project_assignments_user_id_fkey(
          id,
          project_id,
          projects(name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transformar datos para incluir conteo de proyectos
    const usersWithData = data?.map(user => ({
      ...user,
      project_count: user.project_assignments?.length || 0,
      assigned_projects: user.project_assignments?.map((assignment: any) => ({
        id: assignment.id,
        project_id: assignment.project_id,
        project_name: assignment.projects?.name || 'Sin nombre',
      })) || [],
    }))

    return { data: usersWithData, error: null }
  } catch (error) {
    console.error('[getAllUsers] Error:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        project_assignments!project_assignments_user_id_fkey(
          id,
          project_id,
          projects(name)
        )
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getUserById] Error:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar perfil de usuario
 * Solo admin puede actualizar perfiles de otros usuarios
 */
export async function updateUserProfile(userId: string, updates: {
  role?: 'admin' | 'client'
}) {
  try {
    // Actualizar en la tabla profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (profileError) throw profileError

    // Si se actualiza el rol, también actualizar en user_metadata
    if (updates.role) {
      const { error: metadataError } = await supabase.rpc('update_user_metadata', {
        user_id: userId,
        metadata: { role: updates.role }
      })

      // Si falla el RPC, intentar actualización manual
      // (esto requiere permisos de service_role que no tenemos desde el cliente)
      if (metadataError) {
        console.warn('[updateUserProfile] Could not update user_metadata:', metadataError)
      }
    }

    return { data: profileData, error: null }
  } catch (error) {
    console.error('[updateUserProfile] Error:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar usuario
 * Solo admin puede eliminar usuarios
 * NOTA: Esto solo elimina el perfil, no la cuenta de auth
 */
export async function deleteUser(userId: string) {
  try {
    // Primero eliminar asignaciones de proyectos
    await supabase
      .from('project_assignments')
      .delete()
      .eq('user_id', userId)

    // Luego eliminar el perfil
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('[deleteUser] Error:', error)
    return { error }
  }
}

/**
 * Obtener proyectos asignados a un usuario
 */
export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .select(`
        id,
        project_id,
        projects(
          id,
          name,
          description,
          color
        )
      `)
      .eq('user_id', userId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[getUserProjects] Error:', error)
    return { data: null, error }
  }
}

/**
 * Asignar múltiples proyectos a un usuario
 */
export async function assignProjectsToUser(userId: string, projectIds: string[], assignedBy: string) {
  try {
    // Primero obtener asignaciones actuales
    const { data: currentAssignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', userId)

    const currentProjectIds = currentAssignments?.map(a => a.project_id) || []

    // Determinar qué proyectos agregar y cuáles eliminar
    const toAdd = projectIds.filter(id => !currentProjectIds.includes(id))
    const toRemove = currentProjectIds.filter(id => !projectIds.includes(id))

    // Agregar nuevas asignaciones
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map(projectId => ({
        id: crypto.randomUUID(),
        user_id: userId,
        project_id: projectId,
        assigned_by: assignedBy,
      }))

      const { error: addError } = await supabase
        .from('project_assignments')
        .insert(newAssignments)

      if (addError) throw addError
    }

    // Eliminar asignaciones
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('project_assignments')
        .delete()
        .eq('user_id', userId)
        .in('project_id', toRemove)

      if (removeError) throw removeError
    }

    return { error: null }
  } catch (error) {
    console.error('[assignProjectsToUser] Error:', error)
    return { error }
  }
}
