import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Task, Project } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { Calendar, Folder, Edit2, CheckSquare, Square, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDateForDisplay } from '@/lib/dateUtils'
import { getTaskProjectId, getTaskStartDate, getTaskEndDate } from '@/lib/taskUtils'
import { useAuth } from '@/contexts/AuthContext'
import * as TasksService from '@/services/tasks.service'

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
  const { user, profile, isAdmin } = useAuth()
  const [showViews, setShowViews] = useState(false)

  // Registrar vista cuando un NO admin abre el modal
  useEffect(() => {
    if (open && task && user && profile && !isAdmin) {
      console.log('[TaskDetailModal] Usuario cliente abrió tarea:', {
        taskId: task.id,
        userId: user.id,
        isAdmin,
        profileName: profile.name,
        userEmail: user.email
      })
      const userName = profile.name || user.email || 'Usuario'
      TasksService.recordTaskView(task.id, user.id, userName)
        .then(result => {
          console.log('[TaskDetailModal] Resultado de recordTaskView:', result)
        })
        .catch(err => {
          console.error('[TaskDetailModal] Error al registrar vista:', err)
        })
    } else {
      console.log('[TaskDetailModal] No se registró vista:', {
        open,
        hasTask: !!task,
        hasUser: !!user,
        hasProfile: !!profile,
        isAdmin
      })
    }
  }, [open, task, user, profile, isAdmin])

  // Resetear showViews cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setShowViews(false)
    }
  }, [open])

  if (!task) return null

  // Obtener datos de la tarea manejando tanto camelCase como snake_case
  const projectId = getTaskProjectId(task)
  const project = projects.find(p => p.id === projectId)
  const startDate = getTaskStartDate(task)
  const endDate = getTaskEndDate(task)

  // Obtener vistas de la tarea (task_views de Supabase o taskViews del frontend)
  const taskViews = (task as any).task_views || task.taskViews || []

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

          {/* Etiqueta */}
          {task.label && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Etiqueta
              </label>
              <Badge
                className={cn(
                  LABEL_CONFIG[task.label].bgColor,
                  LABEL_CONFIG[task.label].color,
                  'border-0 text-sm px-3 py-1'
                )}
              >
                {LABEL_CONFIG[task.label].icon} {LABEL_CONFIG[task.label].label}
              </Badge>
            </div>
          )}

          {/* Prioridad */}
          {task.priority && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Prioridad
              </label>
              <Badge
                className={cn(
                  PRIORITY_CONFIG[task.priority].bgColor,
                  PRIORITY_CONFIG[task.priority].color,
                  'border-0 text-sm px-3 py-1'
                )}
              >
                {PRIORITY_CONFIG[task.priority].icon} {PRIORITY_CONFIG[task.priority].label}
              </Badge>
            </div>
          )}

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

          {/* Historial de vistas - Solo para administradores */}
          {isAdmin && (
            <div className="border-t pt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowViews(!showViews)}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Ver quiénes vieron esta tarea</span>
                  {taskViews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {taskViews.length}
                    </Badge>
                  )}
                </div>
                {showViews ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showViews && (
                <div className="mt-4">
                  {taskViews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Nadie ha visto esta tarea aún</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                      {taskViews
                        .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
                        .map((view: any) => (
                          <div
                            key={view.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg text-sm hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-700">{view.userName}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(view.viewedAt).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
