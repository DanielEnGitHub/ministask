import { useState, useEffect } from 'react'
import { FolderKanban } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import type { UserWithAssignments } from '@/services/users.service'
import type { Project } from '@/services/projects.service'

interface AssignProjectsModalProps {
  open: boolean
  onClose: () => void
  onSave: (userId: string, projectIds: string[]) => void
  user: UserWithAssignments | null
  projects: Project[]
}

export function AssignProjectsModal({
  open,
  onClose,
  onSave,
  user,
  projects,
}: AssignProjectsModalProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      // Cargar proyectos actualmente asignados
      const assignedProjectIds = user.assigned_projects?.map(p => p.project_id) || []
      setSelectedProjects(assignedProjectIds)
    }
  }, [open, user])

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId)
      } else {
        return [...prev, projectId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await onSave(user.id, selectedProjects)
      onClose()
    } catch (error) {
      console.error('Error saving project assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedProjects(projects.map(p => p.id))
  }

  const handleDeselectAll = () => {
    setSelectedProjects([])
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Asignar Proyectos a {user.email}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick actions */}
          <div className="flex items-center justify-between pb-2 border-b">
            <p className="text-sm text-gray-600">
              {selectedProjects.length} de {projects.length} proyectos seleccionados
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedProjects.length === projects.length}
              >
                Seleccionar todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedProjects.length === 0}
              >
                Deseleccionar todos
              </Button>
            </div>
          </div>

          {/* Projects list */}
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay proyectos disponibles</p>
              <p className="text-xs text-gray-400 mt-1">
                Crea un proyecto primero para poder asignarlo
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleToggleProject(project.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`project-${project.id}`}
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color || '#3B82F6' }}
                          />
                          {project.name}
                        </div>
                      </Label>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || projects.length === 0}
            >
              {loading ? 'Guardando...' : 'Guardar Asignaciones'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
