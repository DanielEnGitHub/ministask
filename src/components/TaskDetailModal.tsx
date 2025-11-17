import { useLiveQuery } from 'dexie-react-hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Task, Project } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { Calendar, Folder, Edit2, CheckSquare, Square } from 'lucide-react'
import { db } from '@/lib/db'
import { formatDateForDisplay } from '@/lib/dateUtils'

interface TaskDetailModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  projects?: Project[]
  onEdit: (task: Task) => void
}

export function TaskDetailModal({
  open,
  onClose,
  task,
  projects = [],
  onEdit
}: TaskDetailModalProps) {
  // Usar useLiveQuery para obtener la tarea actualizada en tiempo real
  const liveTask = useLiveQuery(
    () => task ? db.tasks.get(task.id) : undefined,
    [task?.id]
  )

  // Usar la tarea en vivo si está disponible, si no usar la prop
  const currentTask = liveTask || task

  if (!currentTask) return null

  const project = projects.find(p => p.id === currentTask.projectId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{currentTask.title}</DialogTitle>
            <Button
              onClick={() => {
                onEdit(currentTask)
                onClose()
              }}
              variant="outline"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Estado
            </label>
            <Badge
              className={cn(
                STATUS_CONFIG[currentTask.status].bgColor,
                STATUS_CONFIG[currentTask.status].color,
                'border-0 text-sm px-3 py-1'
              )}
            >
              {STATUS_CONFIG[currentTask.status].label}
            </Badge>
          </div>

          {/* Descripción */}
          {currentTask.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Descripción
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">{currentTask.description}</p>
            </div>
          )}

          {/* Proyecto */}
          {project && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Proyecto
              </label>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{project.name}</span>
              </div>
            </div>
          )}

          {/* Fechas */}
          {(currentTask.startDate || currentTask.endDate) && (
            <div className="grid grid-cols-2 gap-4">
              {currentTask.startDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Inicio
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(currentTask.startDate)}
                    </span>
                  </div>
                </div>
              )}

              {currentTask.endDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Fin
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(currentTask.endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtareas */}
          {currentTask.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Subtareas ({currentTask.subtasks.filter(st => st.completed).length}/{currentTask.subtasks.length})
              </label>
              <div className="space-y-2">
                {currentTask.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    {subtask.completed ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        subtask.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-700'
                      )}
                    >
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de creación */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {new Date(currentTask.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span>{' '}
                {new Date(currentTask.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
