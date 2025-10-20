import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Badge } from './ui/badge'
import type { Task, TaskStatus, SubTask, Project, Sprint, RecurrenceConfig } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TaskTimer } from './TaskTimer'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  task?: Task | null
  projects?: Project[]
  sprints?: Sprint[]
  currentProjectId?: string | null
}

export function TaskModal({ open, onClose, onSave, task, projects = [], sprints = [], currentProjectId }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('created')
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [sprintId, setSprintId] = useState<string>('')

  // Time tracking
  const [estimatedHours, setEstimatedHours] = useState<number>(0)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0)
  const [trackedHours, setTrackedHours] = useState<number>(0)
  const [trackedMinutes, setTrackedMinutes] = useState<number>(0)

  // Recurrencia
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [recurrenceEndOccurrences, setRecurrenceEndOccurrences] = useState<number | undefined>(undefined)

  // Filtrar sprints por proyecto seleccionado (solo activos o pendientes)
  const filteredSprints = sprints.filter(s =>
    projectId &&
    s.projectIds.includes(projectId) &&
    (s.status === 'active' || s.status === 'pending')
  )

  // Encontrar sprint activo del proyecto
  const activeSprint = filteredSprints.find(s => s.status === 'active')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setSubtasks(task.subtasks || [])
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '')
      setEndDate(task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '')
      setProjectId(task.projectId || '')
      setSprintId(task.sprintId || '')

      // Time tracking
      if (task.timeTracking?.estimatedMinutes) {
        const hours = Math.floor(task.timeTracking.estimatedMinutes / 60)
        const mins = task.timeTracking.estimatedMinutes % 60
        setEstimatedHours(hours)
        setEstimatedMinutes(mins)
      } else {
        setEstimatedHours(0)
        setEstimatedMinutes(0)
      }

      if (task.timeTracking?.trackedMinutes) {
        const hours = Math.floor(task.timeTracking.trackedMinutes / 60)
        const mins = Math.floor(task.timeTracking.trackedMinutes % 60)
        setTrackedHours(hours)
        setTrackedMinutes(mins)
      } else {
        setTrackedHours(0)
        setTrackedMinutes(0)
      }

      setIsRecurring(task.isRecurring || false)
      if (task.recurrence) {
        setRecurrenceFrequency(task.recurrence.frequency)
        setRecurrenceInterval(task.recurrence.interval)
        setRecurrenceDays(task.recurrence.daysOfWeek || [])
        setRecurrenceEndDate(task.recurrence.endDate ? new Date(task.recurrence.endDate).toISOString().split('T')[0] : '')
        setRecurrenceEndOccurrences(task.recurrence.endAfterOccurrences)
      }
    } else {
      resetForm()
    }
  }, [task, open, currentProjectId])

  // Auto-seleccionar sprint activo cuando cambia el proyecto
  useEffect(() => {
    if (!task && projectId && activeSprint) {
      setSprintId(activeSprint.id)
    }
  }, [projectId, activeSprint, task])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('created')
    setSubtasks([])
    setNewSubtask('')
    setStartDate('')
    setEndDate('')
    setProjectId(currentProjectId || '')
    setSprintId('')
    setEstimatedHours(0)
    setEstimatedMinutes(0)
    setTrackedHours(0)
    setTrackedMinutes(0)
    setIsRecurring(false)
    setRecurrenceFrequency('weekly')
    setRecurrenceInterval(1)
    setRecurrenceDays([])
    setRecurrenceEndDate('')
    setRecurrenceEndOccurrences(undefined)
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: Date.now().toString(),
          text: newSubtask.trim(),
          completed: false,
        },
      ])
      setNewSubtask('')
    }
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id))
  }

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    )
  }

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let recurrence: RecurrenceConfig | null = null
    if (isRecurring) {
      recurrence = {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDays : undefined,
        endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
        endAfterOccurrences: recurrenceEndOccurrences,
      }
    }

    const totalEstimatedMinutes = estimatedHours * 60 + estimatedMinutes
    const totalTrackedMinutes = trackedHours * 60 + trackedMinutes

    const taskData: Partial<Task> = {
      ...(task?.id && { id: task.id }),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      subtasks,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      projectId: projectId || null,
      sprintId: sprintId || null,
      isRecurring,
      recurrence,
      timeTracking: {
        estimatedMinutes: totalEstimatedMinutes > 0 ? totalEstimatedMinutes : undefined,
        trackedMinutes: totalTrackedMinutes,
        isRunning: task?.timeTracking?.isRunning || false,
        startTime: task?.timeTracking?.startTime,
        sessions: task?.timeTracking?.sessions || []
      },
      updatedAt: new Date(),
      ...(!task?.id && { createdAt: new Date() }),
    }

    onSave(taskData)
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Descripción
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea (opcional)"
              rows={3}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Estado</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </Select>
            <div className="mt-2">
              <Badge className={cn(STATUS_CONFIG[status].bgColor, STATUS_CONFIG[status].color, 'border-0')}>
                {STATUS_CONFIG[status].label}
              </Badge>
            </div>
          </div>

          {/* Proyecto */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Proyecto
              </label>
              <Select
                value={projectId}
                onChange={(e) => {
                  const newProjectId = e.target.value
                  setProjectId(newProjectId)

                  // Auto-asignar sprint activo del proyecto
                  if (newProjectId) {
                    const projectSprints = sprints.filter(s =>
                      s.projectIds.includes(newProjectId) && s.status === 'active'
                    )
                    if (projectSprints.length > 0) {
                      setSprintId(projectSprints[0].id)
                    } else {
                      setSprintId('')
                    }
                  } else {
                    setSprintId('')
                  }
                }}
              >
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>

              {/* Mostrar sprint asignado automáticamente */}
              {projectId && activeSprint && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Sprint asignado: <span className="font-medium text-blue-600">{activeSprint.name}</span>
                </p>
              )}
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Tiempo Estimado */}
          <div className="border rounded-xl p-4 space-y-3">
            <label className="block text-sm font-medium">
              Tiempo Estimado
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">
                  Horas
                </label>
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">
                  Minutos
                </label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Edición manual del tiempo rastreado */}
            {task && (
              <>
                <div className="pt-3 border-t space-y-3">
                  <label className="block text-sm font-medium">
                    Tiempo Rastreado (Edición Manual)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        Horas
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        value={trackedHours}
                        onChange={(e) => setTrackedHours(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">
                        Minutos
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={trackedMinutes}
                        onChange={(e) => setTrackedMinutes(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <TaskTimer
                    task={task}
                    onUpdateTask={(updatedTask) => {
                      // Actualizar la tarea en tiempo real
                      onSave(updatedTask)
                    }}
                    readOnly={true}
                  />
                </div>
              </>
            )}
          </div>

          {/* Recurrencia */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer">
                Tarea recurrente
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Frecuencia
                    </label>
                    <Select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Cada
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        {recurrenceFrequency === 'daily' && 'día(s)'}
                        {recurrenceFrequency === 'weekly' && 'semana(s)'}
                        {recurrenceFrequency === 'monthly' && 'mes(es)'}
                      </span>
                    </div>
                  </div>
                </div>

                {recurrenceFrequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Días de la semana
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleRecurrenceDay(index)}
                          className={cn(
                            'w-10 h-10 rounded-full text-sm font-medium transition-colors',
                            recurrenceDays.includes(index)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Termina
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => {
                          setRecurrenceEndDate(e.target.value)
                          if (e.target.value) setRecurrenceEndOccurrences(undefined)
                        }}
                        placeholder="Fecha de fin"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">o después de</span>
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceEndOccurrences || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setRecurrenceEndOccurrences(val || undefined)
                          if (val) setRecurrenceEndDate('')
                        }}
                        placeholder="N"
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">ocurrencias</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subtareas */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Subtareas
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Añadir subtarea..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSubtask()
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddSubtask}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 group"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="rounded"
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        subtask.completed && 'line-through text-gray-500'
                      )}
                    >
                      {subtask.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
