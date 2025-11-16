import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Sprint, Project } from '@/lib/types'

interface SprintModalProps {
  open: boolean
  onClose: () => void
  onSave: (sprint: Partial<Sprint>) => void
  sprint?: Sprint | null
  projects: Project[]
  currentProjectId?: string
}

export function SprintModal({ open, onClose, onSave, sprint, projects, currentProjectId }: SprintModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (sprint) {
      setName(sprint.name)
      setDescription(sprint.description || '')
      setSelectedProjectIds(sprint.projectIds || [])
      setStartDate(sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '')
      setEndDate(sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '')
    } else {
      resetForm()
    }
  }, [sprint, open, currentProjectId])

  const resetForm = () => {
    setName('')
    setDescription('')
    setSelectedProjectIds(currentProjectId ? [currentProjectId] : [])
    setStartDate('')
    setEndDate('')
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')

    if (end <= start) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    const sprintData: Partial<Sprint> = {
      ...(sprint?.id && { id: sprint.id }),
      name: name.trim(),
      description: description.trim() || undefined,
      projectIds: selectedProjectIds,
      startDate: start,
      endDate: end,
      // Preservar el estado si estamos editando, o dejarlo undefined para que App.tsx lo establezca
      ...(sprint?.id && { status: sprint.status }),
      ...(sprint?.id && { order: sprint.order }),
      ...(!sprint?.id && { createdAt: new Date() }),
    }

    onSave(sprintData)
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sprint ? 'Editar Sprint' : 'Nuevo Sprint'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1, Q1 2024, etc."
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
              placeholder="Describe el sprint (opcional)"
              rows={2}
            />
          </div>

          {/* Proyectos */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Proyectos (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Selecciona los proyectos asociados a este sprint
            </p>
            <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay proyectos disponibles
                </p>
              ) : (
                projects.map((project) => (
                  <label
                    key={project.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      selectedProjectIds.includes(project.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="rounded"
                    />
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <span className="text-sm flex-1">{project.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedProjectIds.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {selectedProjectIds.length} proyecto{selectedProjectIds.length !== 1 ? 's' : ''} seleccionado{selectedProjectIds.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fecha Fin <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || !startDate || !endDate}>
              {sprint ? 'Guardar Cambios' : 'Crear Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
