import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Edit, Trash2, CheckSquare, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import type { Task, TaskStatus } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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
  const tasksByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result

    if (!destination) return

    const newStatus = destination.droppableId as TaskStatus
    onUpdateTaskStatus(draggableId, newStatus)
  }

  const getCompletedSubtasks = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const completed = task.subtasks.filter((st) => st.completed).length
    return `${completed}/${task.subtasks.length}`
  }

  return (
    <div className="p-6 h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 min-w-max h-full">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex-shrink-0 w-80">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      STATUS_CONFIG[status].bgColor
                    )}
                  />
                  <h3 className="font-semibold text-gray-900">
                    {STATUS_CONFIG[status].label}
                  </h3>
                  <span className="text-sm text-gray-500">
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
                        ? 'bg-blue-50 border-2 border-blue-300 border-dashed'
                        : 'bg-gray-100'
                    )}
                  >
                    {tasksByStatus[status].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'cursor-move hover:shadow-md transition-shadow',
                              snapshot.isDragging && 'shadow-lg rotate-2'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-gray-900 flex-1">
                                    {task.title}
                                  </h4>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onEditTask(task)
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (
                                          confirm(
                                            '¿Estás seguro de que quieres eliminar esta tarea?'
                                          )
                                        ) {
                                          onDeleteTask(task.id)
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="space-y-2">
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <CheckSquare className="h-3 w-3" />
                                      <span>
                                        {getCompletedSubtasks(task)} subtareas
                                      </span>
                                    </div>
                                  )}

                                  {(task.startDate || task.endDate) && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {task.startDate &&
                                          format(
                                            new Date(task.startDate),
                                            'dd/MM/yy'
                                          )}
                                        {task.startDate && task.endDate && ' - '}
                                        {task.endDate &&
                                          format(
                                            new Date(task.endDate),
                                            'dd/MM/yy'
                                          )}
                                      </span>
                                    </div>
                                  )}
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
    </div>
  )
}
