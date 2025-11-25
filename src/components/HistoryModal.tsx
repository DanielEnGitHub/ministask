import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Project } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { Calendar, Folder } from 'lucide-react'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  projects?: Project[]
  onEditTask: (task: Task) => void
}

export function HistoryModal({ open, onClose, tasks, projects = [], onEditTask }: HistoryModalProps) {
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Tareas</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Todas las tareas creadas ordenadas por fecha
          </p>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto max-h-[60vh] space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay tareas creadas</p>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const projectName = getProjectName(task.projectId)

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onEditTask(task)
                    onClose()
                  }}
                  className="border rounded-xl p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground truncate">
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
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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

                        {task.subtasks.length > 0 && (
                          <span>
                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtareas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {sortedTasks.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Total: {sortedTasks.length} {sortedTasks.length === 1 ? 'tarea' : 'tareas'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
