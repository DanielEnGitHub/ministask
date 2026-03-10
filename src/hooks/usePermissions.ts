/**
 * =====================================================
 * HOOK: usePermissions
 * =====================================================
 * Proporciona funciones para verificar permisos según el rol
 * del usuario autenticado.
 *
 * Roles:
 * - admin: Acceso completo a todo
 * - subadmin: Mismos permisos que admin en su proyecto asignado,
 *             NO puede gestionar usuarios ni ver proyectos/sprints
 *             fuera de sus asignaciones
 * - client: Solo ve proyectos asignados, puede crear tareas
 *           pero NO puede editar estados ni proyectos
 * =====================================================
 */

import { useAuth } from "@/contexts/AuthContext";

export function usePermissions() {
  const { profile, isAdmin, isClient, isSubAdmin } = useAuth();

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
     * Admin: cualquier proyecto
     * Subadmin: solo sus proyectos asignados
     */
    canEditProject: isAdmin || isSubAdmin,

    /**
     * Puede eliminar proyectos
     * Admin: cualquier proyecto
     * Subadmin: solo sus proyectos asignados
     */
    canDeleteProject: isAdmin || isSubAdmin,

    /**
     * Puede ver todos los proyectos
     * Admin: Sí
     * Subadmin/Client: Solo proyectos asignados
     */
    canViewAllProjects: isAdmin,

    // ============================================
    // SPRINTS
    // ============================================

    /**
     * Puede crear sprints
     * Admin y Subadmin
     */
    canCreateSprint: isAdmin || isSubAdmin,

    /**
     * Puede editar sprints
     * Admin y Subadmin
     */
    canEditSprint: isAdmin || isSubAdmin,

    /**
     * Puede eliminar sprints
     * Admin y Subadmin
     */
    canDeleteSprint: isAdmin || isSubAdmin,

    // ============================================
    // TAREAS
    // ============================================

    /**
     * Puede crear tareas
     * Todos los roles (validación de proyecto asignado se hace en otro lado)
     */
    canCreateTask: true,

    /**
     * Puede editar tareas
     * Admin: cualquier tarea
     * Subadmin: tareas de sus proyectos asignados
     */
    canEditTask: isAdmin || isSubAdmin,

    /**
     * Puede eliminar tareas
     * Admin: cualquier tarea
     * Subadmin: tareas de sus proyectos asignados
     */
    canDeleteTask: isAdmin || isSubAdmin,

    /**
     * Puede cambiar estado de tareas
     * Admin y Subadmin: Pueden cambiar cualquier estado
     * Client: Solo puede cambiar de "En Revisión" (paused) a "Finalizado" (completed) o "Cancelado" (cancelled)
     */
    canChangeTaskStatus: isAdmin || isSubAdmin,

    /**
     * Verifica si puede cambiar de un estado a otro
     * @param currentStatus - Estado actual de la tarea
     * @param newStatus - Nuevo estado deseado
     */
    canChangeTaskStatusTo: (currentStatus: string, newStatus: string) => {
      // Admin y Subadmin pueden cambiar cualquier estado
      if (isAdmin || isSubAdmin) return true;

      // Cliente solo puede cambiar de "paused" (En Revisión) a "completed" (Finalizado) o "cancelled" (Cancelado)
      if (isClient) {
        return (
          currentStatus === "paused" &&
          (newStatus === "completed" || newStatus === "cancelled")
        );
      }

      return false;
    },

    /**
     * Puede ver todas las tareas
     * Admin: Sí
     * Subadmin/Client: Solo tareas de proyectos asignados
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
     * Todos los roles
     */
    canCreateComment: true,

    /**
     * Puede eliminar comentarios
     * Solo sus propios comentarios
     */
    canDeleteComment: (commentUserId: string) => {
      return profile?.id === commentUserId;
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
     * Es subadmin
     */
    isSubAdmin,

    /**
     * Es cliente
     */
    isClient,
  };
}
