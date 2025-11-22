import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Task, Project } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { Calendar, Folder, Edit2, CheckSquare, Square } from 'lucide-react'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { getTaskProjectId, getTaskStartDate, getTaskEndDate } from '@/lib/taskUtils'

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
  if (!task) return null

  // Obtener datos de la tarea manejando tanto camelCase como snake_case
  const projectId = getTaskProjectId(task)
  const project = projects.find(p => p.id === projectId)
  const startDate = getTaskStartDate(task)
  const endDate = getTaskEndDate(task)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{task.title}</DialogTitle>
            <Button
              onClick={() => {
                onEdit(task)
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
                STATUS_CONFIG[task.status].bgColor,
                STATUS_CONFIG[task.status].color,
                'border-0 text-sm px-3 py-1'
              )}
            >
              {STATUS_CONFIG[task.status].label}
            </Badge>
          </div>

          {/* Descripción */}
          {task.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Descripción
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
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
          {(startDate || endDate) && (
            <div className="grid grid-cols-2 gap-4">
              {startDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Inicio
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(startDate)}
                    </span>
                  </div>
                </div>
              )}

              {endDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Fecha Fin
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDateForDisplay(endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtareas */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Subtareas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
              </label>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
