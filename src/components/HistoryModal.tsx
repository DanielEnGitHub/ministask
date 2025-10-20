import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Project, Sprint } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { Clock, Calendar, Folder, Target } from 'lucide-react'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  projects?: Project[]
  sprints?: Sprint[]
  onEditTask: (task: Task) => void
}

export function HistoryModal({ open, onClose, tasks, projects = [], sprints = [], onEditTask }: HistoryModalProps) {
  // Ordenar tareas por fecha de creación (más recientes primero)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tasks])

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return null
    return projects.find(p => p.id === projectId)?.name
  }

  const getSprintName = (sprintId?: string | null) => {
    if (!sprintId) return null
    return sprints.find(s => s.id === sprintId)?.name
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeTracked = (task: Task): string | null => {
    if (!task.timeTracking || task.timeTracking.trackedMinutes === 0) return null

    const hours = Math.floor(task.timeTracking.trackedMinutes / 60)
    const mins = Math.floor(task.timeTracking.trackedMinutes % 60)

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Tareas</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Todas las tareas creadas ordenadas por fecha
          </p>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto max-h-[60vh] space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay tareas creadas</p>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const projectName = getProjectName(task.projectId)
              const sprintName = getSprintName(task.sprintId)
              const timeTracked = getTimeTracked(task)

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onEditTask(task)
                    onClose()
                  }}
                  className="border rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <Badge
                          className={cn(
                            STATUS_CONFIG[task.status].bgColor,
                            STATUS_CONFIG[task.status].color,
                            'border-0 text-xs'
                          )}
                        >
                          {STATUS_CONFIG[task.status].label}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.createdAt)}</span>
                        </div>

                        {projectName && (
                          <div className="flex items-center gap-1">
                            <Folder className="h-3 w-3" />
                            <span>{projectName}</span>
                          </div>
                        )}

                        {sprintName && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{sprintName}</span>
                          </div>
                        )}

                        {timeTracked && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{timeTracked} registrado</span>
                          </div>
                        )}

                        {task.subtasks.length > 0 && (
                          <span>
                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtareas
                          </span>
                        )}

                        {task.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurrente
                          </Badge>
                        )}
                      </div>
                    </div>

                    {task.timeTracking?.isRunning && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        En progreso
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {sortedTasks.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">
              Total: {sortedTasks.length} {sortedTasks.length === 1 ? 'tarea' : 'tareas'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
