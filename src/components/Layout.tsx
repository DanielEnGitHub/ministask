import { List, Kanban, Calendar, FolderKanban, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

export type ViewType = 'list' | 'kanban' | 'calendar'

interface LayoutProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onNewTask: () => void
  children: React.ReactNode
  taskCounts?: {
    created: number
    in_progress: number
    paused: number
    cancelled: number
    completed: number
  }
}

export function Layout({ currentView, onViewChange, onNewTask, children, taskCounts }: LayoutProps) {
  const sidebarOpen = true

  const views = [
    { id: 'list' as ViewType, name: 'Lista', icon: List },
    { id: 'kanban' as ViewType, name: 'Kanban', icon: Kanban },
    { id: 'calendar' as ViewType, name: 'Cronograma', icon: Calendar },
  ]

  const totalTasks = taskCounts
    ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
    : 0

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

        <nav className="flex-1 p-4 space-y-2">
          <div className="mb-4">
            <Button onClick={onNewTask} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
              Vistas
            </p>
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
          </div>

          {taskCounts && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
                Estado
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
    </div>
  )
}
