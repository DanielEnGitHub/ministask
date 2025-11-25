import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Eye, Trash2, CheckSquare, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Task, TaskStatus } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/useConfirm'
import { usePermissions } from '@/hooks/usePermissions'
import { getTaskStartDate, getTaskEndDate } from '@/lib/taskUtils'
import { formatDateForDisplay } from '@/lib/dateUtils'

interface KanbanViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void
}

const STATUS_ORDER: TaskStatus[] = [
  'created',
  'in_progress',
  'paused',
  'cancelled',
  'completed',
]

export function KanbanView({
  tasks,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
}: KanbanViewProps) {
  const { confirm, ConfirmDialog } = useConfirm()
  const permissions = usePermissions()

  const tasksByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId, source } = result

    if (!destination) return

    const newStatus = destination.droppableId as TaskStatus
    const currentStatus = source.droppableId as TaskStatus

    // Verificar si el usuario tiene permiso para cambiar de este estado al nuevo
    if (!permissions.canChangeTaskStatusTo(currentStatus, newStatus)) {
      alert('No tienes permiso para cambiar esta tarea a ese estado')
      return
    }

    onUpdateTaskStatus(draggableId, newStatus)
  }

  const getCompletedSubtasks = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const completed = task.subtasks.filter((st) => st.completed).length
    return `${completed}/${task.subtasks.length}`
  }

  return (
    <div className="p-3 md:p-6 h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 md:gap-4 min-w-max h-full">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex-shrink-0 w-72 md:w-80">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      STATUS_CONFIG[status].bgColor
                    )}
                  />
                  <h3 className="font-semibold text-foreground">
                    {STATUS_CONFIG[status].label}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({tasksByStatus[status].length})
                  </span>
                </div>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-3 p-3 rounded-2xl min-h-[200px] transition-colors',
                      snapshot.isDraggingOver
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 border-dashed'
                        : 'bg-accent/50'
                    )}
                  >
                    {tasksByStatus[status].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={!permissions.canChangeTaskStatus}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              permissions.canChangeTaskStatus
                                ? 'cursor-move'
                                : 'cursor-default',
                              'hover:shadow-md transition-shadow',
                              snapshot.isDragging && 'shadow-lg rotate-2'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-2">
                                    <h4 className="font-medium text-card-foreground">
                                      {task.title}
                                    </h4>
                                    <div className="flex gap-2 flex-wrap">
                                      {task.label && (
                                        <Badge
                                          className={cn(
                                            LABEL_CONFIG[task.label].bgColor,
                                            LABEL_CONFIG[task.label].color,
                                            'border-0 text-xs'
                                          )}
                                        >
                                          {LABEL_CONFIG[task.label].icon} {LABEL_CONFIG[task.label].label}
                                        </Badge>
                                      )}
                                      {task.priority && (
                                        <Badge
                                          className={cn(
                                            PRIORITY_CONFIG[task.priority].bgColor,
                                            PRIORITY_CONFIG[task.priority].color,
                                            'border-0 text-xs'
                                          )}
                                        >
                                          {PRIORITY_CONFIG[task.priority].icon} {PRIORITY_CONFIG[task.priority].label}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onEditTask(task)
                                      }}
                                      title={permissions.canEditTask ? "Editar tarea" : "Ver detalles"}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    {permissions.canDeleteTask && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          const confirmed = await confirm({
                                            title: 'Eliminar tarea',
                                            description: `¿Estás seguro de que quieres eliminar "${task.title}"? Esta acción no se puede deshacer.`,
                                            confirmText: 'Eliminar',
                                            cancelText: 'Cancelar',
                                            variant: 'destructive',
                                          })
                                          if (confirmed) {
                                            onDeleteTask(task.id)
                                          }
                                        }}
                                        title="Eliminar tarea"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="space-y-2">
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <CheckSquare className="h-3 w-3" />
                                      <span>
                                        {getCompletedSubtasks(task)} subtareas
                                      </span>
                                    </div>
                                  )}

                                  {(() => {
                                    const startDate = getTaskStartDate(task)
                                    const endDate = getTaskEndDate(task)
                                    return (startDate || endDate) && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          {startDate && formatDateForDisplay(startDate)}
                                          {startDate && endDate && ' - '}
                                          {endDate && formatDateForDisplay(endDate)}
                                        </span>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <ConfirmDialog />
    </div>
  )
}
