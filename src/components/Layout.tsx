import { useState } from 'react'
import { List, Kanban, Calendar, FolderKanban, Plus, Folder, Edit, Trash2, Moon, Sun, LogOut, User, Users, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import type { Project, Task } from '@/lib/types'
import { useConfirm } from '@/hooks/useConfirm'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'

export type ViewType = 'list' | 'kanban' | 'calendar'

interface LayoutProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onNewTask: () => void
  onNewProject: () => void
  children: React.ReactNode
  taskCounts?: {
    created: number
    in_progress: number
    paused: number
    cancelled: number
    completed: number
  }
  projects?: Project[]
  tasks?: Task[]
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string | null) => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: string) => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function Layout({
  currentView,
  onViewChange,
  onNewTask,
  onNewProject,
  children,
  taskCounts,
  projects = [],
  selectedProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  theme = 'light',
  onToggleTheme,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Cerrado por defecto en móvil
  const { confirm, ConfirmDialog } = useConfirm()
  const { profile, signOut } = useAuth()
  const permissions = usePermissions()
  const location = useLocation()

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Cerrar sesión',
      description: '¿Estás seguro de que quieres cerrar sesión?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      variant: 'default',
    })

    if (confirmed) {
      await signOut()
    }
  }

  const views = [
    { id: 'list' as ViewType, name: 'Lista', icon: List },
    { id: 'kanban' as ViewType, name: 'Kanban', icon: Kanban },
    { id: 'calendar' as ViewType, name: 'Cronograma', icon: Calendar },
  ]

  const totalTasks = taskCounts
    ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
    : 0

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Determinar el título del filtro activo
  const getFilterLabel = () => {
    if (selectedProject) return selectedProject.name
    return 'Todas'
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Backdrop para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r border-border transition-all duration-300 flex flex-col z-50',
          // Mobile: sidebar fixed overlay
          'fixed lg:relative inset-y-0 left-0',
          // Ancho
          'w-64',
          // Mostrar/ocultar
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">MiniTasks</h1>
            <button
              onClick={onToggleTheme}
              className="ml-auto p-2 rounded-lg hover:bg-accent transition-colors"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{totalTasks} tareas totales</p>

          {/* User info and logout */}
          {profile && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs font-medium text-foreground truncate">
                      {profile.full_name || profile.email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize ml-5">
                    {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="mb-4 space-y-3">
            <Button onClick={onNewTask} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>

            {/* Botón Gestión de Usuarios (solo admin) */}
            {permissions.canViewAllUsers && (
              <Link to="/users" className="block">
                <Button
                  variant={location.pathname === '/users' ? 'default' : 'outline'}
                  className="w-full"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gestión de Usuarios
                </Button>
              </Link>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            <Accordion type="multiple" className="space-y-2" defaultValue={['proyectos', 'vistas']}>
            {/* Proyectos */}
            <AccordionItem value="proyectos" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2 hover:no-underline hover:bg-accent rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Proyectos</span>
                  {permissions.canCreateProject && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        onNewProject()
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Nuevo Proyecto"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          onNewProject()
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2">
                {projects.length === 0 ? (
                  permissions.canCreateProject ? (
                    <Button onClick={onNewProject} variant="outline" className="w-full" size="sm">
                      <Folder className="h-4 w-4 mr-2" />
                      Crear Proyecto
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground px-3 py-2">
                      No hay proyectos disponibles
                    </p>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => onSelectProject?.(null)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        !selectedProjectId
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <FolderKanban className="h-4 w-4" />
                      Todos los proyectos
                    </button>

                    {projects.map((project) => (
                      <div key={project.id} className="group relative">
                        <button
                          onClick={() => onSelectProject?.(project.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 pr-20 rounded-xl text-sm font-medium transition-colors',
                            selectedProjectId === project.id
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'text-muted-foreground hover:bg-accent'
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || '#3B82F6' }}
                          />
                          <span className="flex-1 text-left truncate">{project.name}</span>
                        </button>

                        {(permissions.canEditProject || permissions.canDeleteProject) && (
                          <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                            {permissions.canEditProject && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditProject?.(project)
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Editar"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                            {permissions.canDeleteProject && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const confirmed = await confirm({
                                    title: 'Eliminar proyecto',
                                    description: `¿Estás seguro de que quieres eliminar el proyecto "${project.name}"? Las tareas asociadas no se eliminarán, pero se desasociarán del proyecto.`,
                                    confirmText: 'Eliminar',
                                    cancelText: 'Cancelar',
                                    variant: 'destructive',
                                  })
                                  if (confirmed) {
                                    onDeleteProject?.(project.id)
                                  }
                                }}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Vistas */}
            <AccordionItem value="vistas" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2 hover:no-underline hover:bg-accent rounded-lg">
                Vistas
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      currentView === view.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <view.icon className="h-4 w-4" />
                    {view.name}
                  </button>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>

          {/* Estados - Fijo en la parte inferior del sidebar */}
          {taskCounts && (
            <div className="pt-4 mt-4 border-t border-border flex-shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
                Estado - {getFilterLabel()}
              </p>
              <div className="space-y-1 text-sm px-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creados</span>
                  <span className="font-medium text-foreground">{taskCounts.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En Proceso</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{taskCounts.in_progress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pausados</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{taskCounts.paused}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelados</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{taskCounts.cancelled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Finalizados</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{taskCounts.completed}</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header con menú hamburguesa (solo móvil) */}
        <div className="lg:hidden bg-card border-b border-border p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">MiniTasks</h1>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-muted-foreground">{getFilterLabel()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      <ConfirmDialog />
    </div>
  )
}
