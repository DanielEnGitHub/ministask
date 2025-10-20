import { List, Kanban, Calendar, FolderKanban, Plus, Folder, Edit, Trash2, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import type { Project, Sprint } from '@/lib/types'
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
  selectedProjectId?: string | null
  onSelectProject?: (projectId: string | null) => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (projectId: string) => void
  onEditSprint?: (sprint: Sprint) => void
  onDeleteSprint?: (sprintId: string) => void
  onCompleteSprint?: (sprintId: string) => void
  onActivateSprint?: (sprintId: string) => void
  filterType?: 'all' | 'project' | 'sprint' | 'unassigned'
  filterSprintId?: string | null
  onFilterBySprint?: (sprintId: string | null) => void
  onFilterUnassigned?: () => void
  onFilterAll?: () => void
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
  selectedProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onEditSprint,
  onDeleteSprint,
  onCompleteSprint: _onCompleteSprint,
  onActivateSprint: _onActivateSprint,
  filterType = 'all',
  filterSprintId,
  onFilterBySprint,
  onFilterUnassigned,
  onFilterAll,
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
  const selectedSprint = sprints.find(s => s.id === filterSprintId)

  // Filtrar sprints: si hay proyecto seleccionado, mostrar sprints que lo incluyan
  const filteredSprints = selectedProjectId
    ? sprints.filter(s => s.projectIds.includes(selectedProjectId))
    : sprints

  // Determinar el título del filtro activo
  const getFilterLabel = () => {
    if (filterType === 'unassigned') return 'Sin asignar'
    if (filterType === 'project' && selectedProject) return selectedProject.name
    if (filterType === 'sprint' && selectedSprint) return selectedSprint.name
    return 'Todas'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">MiniTasks</h1>
          </div>
          <p className="text-sm text-gray-500">{totalTasks} tareas totales</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="mb-4">
            <Button onClick={onNewTask} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            <Accordion type="multiple" className="space-y-2" defaultValue={['filtros', 'proyectos', 'sprints', 'vistas']}>
            {/* Filtros */}
            <AccordionItem value="filtros" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 hover:no-underline hover:bg-gray-50 rounded-lg">
                Filtros
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2">
                <button
                  onClick={onFilterAll}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    filterType === 'all'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <List className="h-4 w-4" />
                  Todas las tareas
                </button>

                <button
                  onClick={onFilterUnassigned}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    filterType === 'unassigned'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <FolderKanban className="h-4 w-4" />
                  Sin asignar
                </button>
              </AccordionContent>
            </AccordionItem>

            {/* Proyectos */}
            <AccordionItem value="proyectos" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 hover:no-underline hover:bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Proyectos</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewProject()
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
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
                            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                            selectedProjectId === project.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
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
              <AccordionTrigger className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 hover:no-underline hover:bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Sprints</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewSprint()
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <p className="text-xs text-gray-500 text-center py-4">
                    {selectedProject ? 'No hay sprints para este proyecto' : 'No hay sprints'}
                  </p>
                ) : (
                  filteredSprints.map((sprint) => {
                    const sprintProjects = projects.filter(p => sprint.projectIds.includes(p.id))

                    return (
                      <div key={sprint.id} className="group relative">
                        <button
                          onClick={() => onFilterBySprint?.(sprint.id)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-sm text-left transition-all duration-200",
                            filterType === 'sprint' && filterSprintId === sprint.id
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Target className={cn(
                              "h-3 w-3 flex-shrink-0",
                              filterType === 'sprint' && filterSprintId === sprint.id
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            )} />
                            <span className={cn(
                              "flex-1 truncate font-medium",
                              filterType === 'sprint' && filterSprintId === sprint.id
                                ? 'text-blue-700'
                                : 'text-gray-900'
                            )}>{sprint.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 ml-5 space-y-1">
                            <div>
                              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                            </div>
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
                        </button>

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
              <AccordionTrigger className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 hover:no-underline hover:bg-gray-50 rounded-lg">
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
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
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
            <div className="pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
                Estado - {getFilterLabel()}
              </p>
              <div className="space-y-1 text-sm px-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Creados</span>
                  <span className="font-medium text-gray-700">{taskCounts.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En Proceso</span>
                  <span className="font-medium text-blue-600">{taskCounts.in_progress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pausados</span>
                  <span className="font-medium text-yellow-600">{taskCounts.paused}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelados</span>
                  <span className="font-medium text-red-600">{taskCounts.cancelled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Finalizados</span>
                  <span className="font-medium text-green-600">{taskCounts.completed}</span>
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
