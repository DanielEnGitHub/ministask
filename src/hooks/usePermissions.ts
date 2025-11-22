/**
 * =====================================================
 * HOOK: usePermissions
 * =====================================================
 * Proporciona funciones para verificar permisos según el rol
 * del usuario autenticado.
 *
 * Roles:
 * - admin: Acceso completo a todo
 * - client: Solo ve proyectos asignados, puede crear tareas
 *           pero NO puede editar estados ni proyectos
 * =====================================================
 */

import { useAuth } from '@/contexts/AuthContext'

export function usePermissions() {
  const { profile, isAdmin, isClient } = useAuth()

  return {
    // ============================================
    // PROYECTOS
    // ============================================

    /**
     * Puede crear proyectos
     * Solo admin
     */
    canCreateProject: isAdmin,

    /**
     * Puede editar proyectos
     * Solo admin
     */
    canEditProject: isAdmin,

    /**
     * Puede eliminar proyectos
     * Solo admin
     */
    canDeleteProject: isAdmin,

    /**
     * Puede ver todos los proyectos
     * Admin: Sí
     * Client: Solo proyectos asignados
     */
    canViewAllProjects: isAdmin,

    // ============================================
    // SPRINTS
    // ============================================

    /**
     * Puede crear sprints
     * Solo admin
     */
    canCreateSprint: isAdmin,

    /**
     * Puede editar sprints
     * Solo admin
     */
    canEditSprint: isAdmin,

    /**
     * Puede eliminar sprints
     * Solo admin
     */
    canDeleteSprint: isAdmin,

    // ============================================
    // TAREAS
    // ============================================

    /**
     * Puede crear tareas
     * Admin: En cualquier proyecto
     * Client: Solo en proyectos asignados
     */
    canCreateTask: true, // Ambos pueden crear tareas (validación de proyecto asignado se hace en otro lado)

    /**
     * Puede editar tareas
     * Solo admin puede editar cualquier tarea
     */
    canEditTask: isAdmin,

    /**
     * Puede eliminar tareas
     * Solo admin
     */
    canDeleteTask: isAdmin,

    /**
     * Puede cambiar estado de tareas
     * Admin: Puede cambiar cualquier estado
     * Client: Solo puede cambiar de "En Revisión" (paused) a "Finalizado" (completed)
     */
    canChangeTaskStatus: isAdmin,

    /**
     * Verifica si puede cambiar de un estado a otro
     * @param currentStatus - Estado actual de la tarea
     * @param newStatus - Nuevo estado deseado
     */
    canChangeTaskStatusTo: (currentStatus: string, newStatus: string) => {
      // Admin puede cambiar cualquier estado
      if (isAdmin) return true

      // Cliente solo puede cambiar de "paused" (En Revisión) a "completed" (Finalizado)
      if (isClient) {
        return currentStatus === 'paused' && newStatus === 'completed'
      }

      return false
    },

    /**
     * Puede ver todas las tareas
     * Admin: Sí
     * Client: Solo tareas de proyectos asignados
     */
    canViewAllTasks: isAdmin,

    // ============================================
    // USUARIOS Y ASIGNACIONES
    // ============================================

    /**
     * Puede crear usuarios
     * Solo admin
     */
    canCreateUser: isAdmin,

    /**
     * Puede asignar usuarios a proyectos
     * Solo admin
     */
    canAssignUsersToProjects: isAdmin,

    /**
     * Puede ver lista de todos los usuarios
     * Solo admin
     */
    canViewAllUsers: isAdmin,

    // ============================================
    // COMENTARIOS
    // ============================================

    /**
     * Puede crear comentarios
     * Ambos roles
     */
    canCreateComment: true,

    /**
     * Puede eliminar comentarios
     * Solo sus propios comentarios
     */
    canDeleteComment: (commentUserId: string) => {
      return profile?.id === commentUserId
    },

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Rol del usuario
     */
    role: profile?.role || null,

    /**
     * Es admin
     */
    isAdmin,

    /**
     * Es cliente
     */
    isClient,
  }
}
