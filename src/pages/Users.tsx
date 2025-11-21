import { useState, useEffect } from 'react'
import { Users as UsersIcon, Plus, Edit, Trash2, FolderKanban, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserModal } from '@/components/UserModal'
import { AssignProjectsModal } from '@/components/AssignProjectsModal'
import { useConfirm } from '@/hooks/useConfirm'
import { useAuth } from '@/contexts/AuthContext'
import * as UsersService from '@/services/users.service'
import * as ProjectsService from '@/services/projects.service'
import type { UserWithAssignments } from '@/services/users.service'
import type { Project } from '@/services/projects.service'
import { cn } from '@/lib/utils'

export function Users() {
  const { user, isAdmin } = useAuth()
  const { confirm, ConfirmDialog } = useConfirm()

  const [users, setUsers] = useState<UserWithAssignments[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isAssignProjectsModalOpen, setIsAssignProjectsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithAssignments | null>(null)
  const [assigningUser, setAssigningUser] = useState<UserWithAssignments | null>(null)

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/'
    }
  }, [isAdmin])

  // Cargar datos
  useEffect(() => {
    if (!user || !isAdmin) return
    loadData()
  }, [user, isAdmin])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Cargar usuarios
      const { data: usersData } = await UsersService.getAllUsers()
      setUsers(usersData || [])

      // Cargar proyectos (para el modal de asignación)
      const { data: projectsData } = await ProjectsService.getAllProjects(user.id, true)
      setProjects(projectsData || [])
    } catch (error) {
      console.error('[loadData] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewUser = () => {
    setEditingUser(null)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: UserWithAssignments) => {
    setEditingUser(user)
    setIsUserModalOpen(true)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Eliminar usuario',
      description: `¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción eliminará también sus asignaciones de proyectos.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })

    if (confirmed) {
      try {
        const { error } = await UsersService.deleteUser(userId)
        if (!error) {
          setUsers(prev => prev.filter(u => u.id !== userId))
        }
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleAssignProjects = (user: UserWithAssignments) => {
    setAssigningUser(user)
    setIsAssignProjectsModalOpen(true)
  }

  const handleSaveUser = async (userData: {
    role: 'admin' | 'client'
  }) => {
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const { data } = await UsersService.updateUserProfile(editingUser.id, {
          role: userData.role,
        })

        if (data) {
          setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u))
        }
      }
      // Nota: La creación de nuevos usuarios se hace desde el modal con Supabase Auth
      await loadData()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleSaveProjectAssignments = async (userId: string, projectIds: string[]) => {
    if (!user) return

    try {
      const { error } = await UsersService.assignProjectsToUser(userId, projectIds, user.id)
      if (!error) {
        await loadData()
      }
    } catch (error) {
      console.error('Error assigning projects:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" title="Volver al Dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-sm text-gray-500">Administra usuarios y asigna proyectos</p>
                </div>
              </div>
            </div>
            <Button onClick={handleNewUser} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
              <p className="text-sm text-gray-500 mb-4">
                Comienza creando tu primer usuario
              </p>
              <Button onClick={handleNewUser}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((userItem) => (
              <Card key={userItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* User Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {userItem.email}
                          </h3>
                          <Badge
                            className={cn(
                              userItem.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            )}
                          >
                            {userItem.role === 'admin' ? 'Admin' : 'Cliente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FolderKanban className="h-4 w-4" />
                          <span>
                            {userItem.project_count || 0} {userItem.project_count === 1 ? 'proyecto' : 'proyectos'} asignado{userItem.project_count === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignProjects(userItem)}
                        className="gap-2"
                      >
                        <FolderKanban className="h-4 w-4" />
                        Asignar Proyectos
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(userItem)}
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userItem.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(userItem.id, userItem.full_name || userItem.email)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Projects */}
                  {userItem.assigned_projects && userItem.assigned_projects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Proyectos asignados:</p>
                      <div className="flex flex-wrap gap-2">
                        {userItem.assigned_projects.map((project) => (
                          <Badge key={project.id} variant="outline" className="text-xs">
                            {project.project_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        open={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        onUserCreated={loadData}
      />

      <AssignProjectsModal
        open={isAssignProjectsModalOpen}
        onClose={() => setIsAssignProjectsModalOpen(false)}
        onSave={handleSaveProjectAssignments}
        user={assigningUser}
        projects={projects}
      />

      <ConfirmDialog />
    </div>
  )
}
