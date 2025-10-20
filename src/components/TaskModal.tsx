import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Badge } from './ui/badge'
import type { Task, TaskStatus, SubTask, TaskRange } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  task?: Task | null
  ranges?: TaskRange[]
}

export function TaskModal({ open, onClose, onSave, task, ranges = [] }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('created')
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rangeId, setRangeId] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setSubtasks(task.subtasks || [])
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '')
      setEndDate(task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '')
      setRangeId(task.rangeId || '')
    } else {
      resetForm()
    }
  }, [task, open])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('created')
    setSubtasks([])
    setNewSubtask('')
    setStartDate('')
    setEndDate('')
    setRangeId('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const taskData: Partial<Task> = {
      ...(task?.id && { id: task.id }),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      subtasks,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      rangeId: rangeId || undefined,
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

          {/* Estado y Rango */}
          <div className="grid grid-cols-2 gap-4">
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

            {ranges.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Rango
                </label>
                <Select
                  value={rangeId}
                  onChange={(e) => setRangeId(e.target.value)}
                >
                  <option value="">Sin rango</option>
                  {ranges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

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
