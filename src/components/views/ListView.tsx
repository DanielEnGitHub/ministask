import { useState, useMemo } from 'react'
import { Search, Eye, Trash2, CheckSquare, Calendar } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Task } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useConfirm } from '@/hooks/useConfirm'

interface ListViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function ListView({ tasks, onEditTask, onDeleteTask }: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [tasks, searchQuery])

  const getCompletedSubtasks = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const completed = task.subtasks.filter((st) => st.completed).length
    return `${completed}/${task.subtasks.length}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar tareas..."
          className="pl-10"
        />
      </div>

      {/* Resultados */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredTasks.length} de {tasks.length} tareas
      </div>

      {/* Lista de tareas */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No se encontraron tareas</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
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
                            'border-0'
                          )}
                        >
                          {LABEL_CONFIG[task.label].icon} {LABEL_CONFIG[task.label].label}
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          <span>{getCompletedSubtasks(task)} subtareas</span>
                        </div>
                      )}

                      {(task.startDate || task.endDate) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {task.startDate &&
                              format(new Date(task.startDate), 'dd/MM/yyyy')}
                            {task.startDate && task.endDate && ' - '}
                            {task.endDate &&
                              format(new Date(task.endDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEditTask(task)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {task.subtasks && task.subtasks.length > 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-3 space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          readOnly
                          className="rounded pointer-events-none"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            subtask.completed && 'line-through text-gray-500'
                          )}
                        >
                          {subtask.text}
                        </span>
                      </div>
                    ))}
                    {task.subtasks.length > 3 && (
                      <p className="text-xs text-gray-500 pl-6">
                        +{task.subtasks.length - 3} más
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
