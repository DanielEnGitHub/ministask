import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Task } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG, PRIORITY_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  differenceInDays,
  addDays,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfirm } from '@/hooks/useConfirm'
import { usePermissions } from '@/hooks/usePermissions'
import { normalizeDate, isDateInRange } from '@/lib/dateUtils'
import { getTaskStartDate, getTaskEndDate, hasTaskDates } from '@/lib/taskUtils'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'

interface CalendarViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onUpdateTaskDates: (taskId: string, startDate: Date | undefined, endDate: Date | undefined) => void
}

export function CalendarView({
  tasks,
  onEditTask,
  onDeleteTask,
  onUpdateTaskDates,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { confirm, ConfirmDialog } = useConfirm()
  const permissions = usePermissions()
  const canDragTasks = permissions.canEditTask // Solo admins pueden editar tareas

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => hasTaskDates(task))
  }, [tasks])

  const getTasksForDay = (day: Date) => {
    return tasksWithDates.filter((task) => {
      const dayNormalized = normalizeDate(day)
      const startDate = getTaskStartDate(task)
      const endDate = getTaskEndDate(task)

      if (startDate && endDate) {
        return isDateInRange(dayNormalized, startDate, endDate)
      }

      if (startDate) {
        const start = normalizeDate(startDate)
        return dayNormalized.getTime() === start.getTime()
      }

      if (endDate) {
        const end = normalizeDate(endDate)
        return dayNormalized.getTime() === end.getTime()
      }

      return false
    })
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDragEnd = (result: DropResult) => {
    // Solo permitir drag & drop si el usuario tiene permisos
    if (!canDragTasks) return

    const { draggableId, destination } = result

    if (!destination) return

    // draggableId es el taskId
    // destination.droppableId es el día en formato ISO
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    const newDay = new Date(destination.droppableId)
    const startDate = getTaskStartDate(task)
    const endDate = getTaskEndDate(task)

    // Calcular nuevas fechas manteniendo la duración
    let newStartDate: Date | undefined
    let newEndDate: Date | undefined

    if (startDate && endDate) {
      // Tiene ambas fechas: mover todo el rango manteniendo la duración
      const duration = differenceInDays(new Date(endDate), new Date(startDate))
      newStartDate = newDay
      newEndDate = addDays(newDay, duration)
    } else if (startDate) {
      // Solo tiene fecha de inicio
      newStartDate = newDay
      newEndDate = undefined
    } else if (endDate) {
      // Solo tiene fecha de fin
      newStartDate = undefined
      newEndDate = newDay
    }

    onUpdateTaskDates(task.id, newStartDate, newEndDate)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleToday} className="flex-1 sm:flex-none">
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-2xl overflow-hidden bg-card">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-accent/50 border-b">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div
              key={day}
              className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-muted-foreground"
              title={['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i]}
            >
              <span className="md:hidden">{day}</span>
              <span className="hidden md:inline">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for alignment */}
          {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[80px] md:min-h-[120px] border-r border-b bg-accent/30"
              />
            )
          )}

          {/* Day cells */}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isToday = isSameDay(day, new Date())

            return (
              <Droppable key={day.toISOString()} droppableId={day.toISOString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'min-h-[80px] md:min-h-[120px] border-r border-b p-1 md:p-2 space-y-1',
                      isToday && 'bg-blue-50 dark:bg-blue-950/30',
                      snapshot.isDraggingOver && 'bg-green-50 dark:bg-green-950/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-xs md:text-sm font-medium',
                          isToday
                            ? 'bg-blue-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs'
                            : 'text-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px]">
                      {dayTasks.slice(0, 3).map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!canDragTasks}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'text-[10px] md:text-xs p-1 md:p-1.5 rounded group relative',
                                canDragTasks ? 'cursor-move' : 'cursor-pointer',
                                STATUS_CONFIG[task.status].bgColor,
                                STATUS_CONFIG[task.status].color,
                                snapshot.isDragging && 'opacity-50 shadow-lg'
                              )}
                              onClick={() => onEditTask(task)}
                            >
                              <div className="flex items-center gap-0.5 md:gap-1">
                                {task.label && (
                                  <span className="text-[10px] md:text-xs hidden md:inline">{LABEL_CONFIG[task.label].icon}</span>
                                )}
                                {task.priority && (
                                  <span className="text-[10px] md:text-xs hidden md:inline">{PRIORITY_CONFIG[task.priority].icon}</span>
                                )}
                                <div className="truncate font-medium flex-1 leading-tight">{task.title}</div>
                              </div>

                              {/* Hover actions */}
                              <div className="absolute top-0 right-0 hidden group-hover:flex gap-0.5 bg-card shadow-sm rounded border p-0.5 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditTask(task)
                                  }}
                                  className="p-0.5 hover:bg-accent rounded"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button
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
                                  className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
                                  title="Eliminar tarea"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1.5">
                          +{dayTasks.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </div>

      {/* Tasks without dates */}
      {tasksWithDates.length < tasks.length && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Tareas sin fecha ({tasks.length - tasksWithDates.length})
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((task) => !hasTaskDates(task))
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2 hover:bg-accent/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Badge
                        className={cn(
                          STATUS_CONFIG[task.status].bgColor,
                          STATUS_CONFIG[task.status].color,
                          'border-0'
                        )}
                      >
                        {STATUS_CONFIG[task.status].label}
                      </Badge>
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
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEditTask(task)}
                        title="Ver detalles"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
      </div>
    </DragDropContext>
  )
}
