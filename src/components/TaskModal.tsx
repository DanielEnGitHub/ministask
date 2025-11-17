import { useState, useEffect } from 'react'
import { Plus, Trash2, Image, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Badge } from './ui/badge'
import type { Task, TaskStatus, TaskLabel, SubTask, Project } from '@/lib/types'
import { STATUS_CONFIG, LABEL_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toDateInputValue } from '@/lib/dateUtils'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => void
  task?: Task | null
  projects?: Project[]
  currentProjectId?: string | null
}

export function TaskModal({ open, onClose, onSave, task, projects = [], currentProjectId }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('created')
  const [label, setLabel] = useState<TaskLabel | ''>('')
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setLabel(task.label || '')
      setSubtasks(task.subtasks || [])
      setStartDate(toDateInputValue(task.startDate))
      setEndDate(toDateInputValue(task.endDate))
      setProjectId(task.projectId || '')
      setImages(task.images || [])
    } else {
      resetForm()
    }
  }, [task, open, currentProjectId])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('created')
    setLabel('')
    setSubtasks([])
    setNewSubtask('')
    setStartDate('')
    setEndDate('')
    setProjectId(currentProjectId || '')
    setImages([])
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!projectId) {
      alert('Por favor, selecciona un proyecto')
      return
    }

    const taskData: Partial<Task> = {
      ...(task?.id && { id: task.id }),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      label: label || undefined,
      subtasks,
      startDate: startDate ? new Date(startDate + 'T00:00:00') : undefined,
      endDate: endDate ? new Date(endDate + 'T00:00:00') : undefined,
      projectId: projectId || null,
      images: images.length > 0 ? images : undefined,
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

          {/* Etiqueta */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Etiqueta</label>
            <Select
              value={label}
              onChange={(e) => setLabel(e.target.value as TaskLabel | '')}
            >
              <option value="">Sin etiqueta</option>
              {Object.entries(LABEL_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </Select>
            {label && (
              <div className="mt-2">
                <Badge className={cn(LABEL_CONFIG[label].bgColor, LABEL_CONFIG[label].color, 'border-0')}>
                  {LABEL_CONFIG[label].icon} {LABEL_CONFIG[label].label}
                </Badge>
              </div>
            )}
          </div>

          {/* Proyecto */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Proyecto <span className="text-red-500">*</span>
            </label>
            {projects.length === 0 ? (
              <p className="text-sm text-red-600 p-2 bg-red-50 rounded-lg">
                No hay proyectos disponibles. Crea un proyecto antes de crear una tarea.
              </p>
            ) : (
              <>
                <Select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </>
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

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Imágenes
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                  id="image-upload"
                />
                <Button type="button" size="icon" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                  <Image className="h-4 w-4" />
                </Button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <Button type="submit" disabled={!title.trim() || !projectId || projects.length === 0}>
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
