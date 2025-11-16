import { List, Kanban, Calendar, FolderKanban, Plus, Folder, Edit, Trash2, Target, Moon, Sun, Play, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import type { Project, Sprint, Task } from '@/lib/types'
import { SPRINT_STATUS_CONFIG } from '@/lib/types'
import { useConfirm } from '@/hooks/useConfirm'

export type ViewType = 'list' | 'kanban' | 'calendar'

interface LayoutProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onNewTask: () => void
  onNewProject: () => void
  onNewSprint: () => void
  children: React.ReactNode
  taskCounts?: {
    created: number
    in_progress: number
    paused: number
    cancelled: number
    completed: number
  }
  projects?: Project[]
  sprints?: Sprint[]
  tasks?: Task[]
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string | null) => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: string) => void
  onEditSprint?: (sprint: Sprint) => void
  onDeleteSprint?: (sprintId: string) => void
  onCompleteSprint?: (sprintId: string) => void
  onActivateSprint?: (sprintId: string) => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function Layout({
  currentView,
  onViewChange,
  onNewTask,
  onNewProject,
  onNewSprint,
  children,
  taskCounts,
  projects = [],
  sprints = [],
  tasks = [],
  selectedProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onEditSprint,
  onDeleteSprint,
  onCompleteSprint: _onCompleteSprint,
  onActivateSprint: _onActivateSprint,
  theme = 'light',
  onToggleTheme,
}: LayoutProps) {
  const sidebarOpen = true
  const { confirm, ConfirmDialog } = useConfirm()

  const views = [
    { id: 'list' as ViewType, name: 'Lista', icon: List },
    { id: 'kanban' as ViewType, name: 'Kanban', icon: Kanban },
    { id: 'calendar' as ViewType, name: 'Cronograma', icon: Calendar },
  ]

  const totalTasks = taskCounts
    ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
    : 0

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Filtrar sprints: si hay proyecto seleccionado, mostrar sprints que lo incluyan
  const filteredSprints = selectedProjectId
    ? sprints.filter(s => s.projectIds.includes(selectedProjectId))
    : sprints

  // Determinar el título del filtro activo
  const getFilterLabel = () => {
    if (selectedProject) return selectedProject.name
    return 'Todas'
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r border-border transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
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
        </div>

        <nav className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="mb-4">
            <Button onClick={onNewTask} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            <Accordion type="multiple" className="space-y-2" defaultValue={['proyectos', 'sprints', 'vistas']}>
            {/* Proyectos */}
            <AccordionItem value="proyectos" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2 hover:no-underline hover:bg-accent rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Proyectos</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewProject()
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Nuevo Proyecto"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2">
                {projects.length === 0 ? (
                  <Button onClick={onNewProject} variant="outline" className="w-full" size="sm">
                    <Folder className="h-4 w-4 mr-2" />
                    Crear Proyecto
                  </Button>
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

                        <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
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
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Sprints */}
            <AccordionItem value="sprints" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2 hover:no-underline hover:bg-accent rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Sprints</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewSprint()
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Nuevo Sprint"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2">
                {sprints.length === 0 ? (
                  <Button onClick={onNewSprint} variant="outline" className="w-full" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Nuevo Sprint
                  </Button>
                ) : filteredSprints.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {selectedProject ? 'No hay sprints para este proyecto' : 'No hay sprints'}
                  </p>
                ) : (
                  filteredSprints.map((sprint) => {
                    const sprintProjects = projects.filter(p => sprint.projectIds.includes(p.id))
                    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id)
                    const completedTasks = sprintTasks.filter(t => t.status === 'completed').length
                    const totalTasks = sprintTasks.length
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                    const statusConfig = SPRINT_STATUS_CONFIG[sprint.status]

                    return (
                      <div key={sprint.id} className="group relative">
                        <div className="w-full px-3 py-2 pr-20 rounded-xl text-sm text-left hover:bg-accent">
                          <div className="flex items-center gap-2 mb-1">
                            {sprint.status === 'active' ? (
                              <Play className="h-3 w-3 flex-shrink-0 text-green-600" />
                            ) : sprint.status === 'completed' ? (
                              <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-blue-600" />
                            ) : (
                              <Target className="h-3 w-3 flex-shrink-0 text-gray-400" />
                            )}
                            <span className="flex-1 truncate font-medium text-foreground">{sprint.name}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusConfig.bgColor, statusConfig.color)}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground ml-5 space-y-1.5">
                            <div>
                              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                            </div>
                            {totalTasks > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-600 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{progress}%</span>
                                </div>
                                <div className="text-xs">
                                  {completedTasks}/{totalTasks} tareas
                                </div>
                              </div>
                            )}
                            {sprintProjects.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {sprintProjects.map(project => (
                                  <div
                                    key={project.id}
                                    className="flex items-center gap-1"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: project.color || '#3B82F6' }}
                                    />
                                    <span className="text-xs">{project.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditSprint?.(sprint)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Editar"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const confirmed = await confirm({
                                title: 'Eliminar sprint',
                                description: `¿Estás seguro de que quieres eliminar el sprint "${sprint.name}"? Las tareas asociadas se desasociarán del sprint.`,
                                confirmText: 'Eliminar',
                                cancelText: 'Cancelar',
                                variant: 'destructive',
                              })
                              if (confirmed) {
                                onDeleteSprint?.(sprint.id)
                              }
                            }}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
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
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      <ConfirmDialog />
    </div>
  )
}
