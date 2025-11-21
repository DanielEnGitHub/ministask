import { useState, useEffect } from 'react'
import { Layout, type ViewType } from '@/components/Layout'
import { TaskModal } from '@/components/TaskModal'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { ProjectModal } from '@/components/ProjectModal'
import { ListView } from '@/components/views/ListView'
import { KanbanView } from '@/components/views/KanbanView'
import { CalendarView } from '@/components/views/CalendarView'
import type { Task, TaskStatus, Project } from '@/lib/types'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/contexts/AuthContext'
import * as ProjectsService from '@/services/projects.service'
import * as TasksService from '@/services/tasks.service'
import { getTaskProjectId } from '@/lib/taskUtils'

export function Dashboard() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, isAdmin } = useAuth()

  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Estado para datos desde Supabase
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    if (!user || !profile) return

    loadData()
  }, [user, profile])

  const loadData = async () => {
    if (!user || !profile) return

    setLoading(true)
    try {
      // Cargar proyectos según rol
      const { data: projectsData } = await ProjectsService.getAllProjects(user.id, isAdmin)
      setProjects(projectsData || [])

      // Cargar tareas según rol
      const { data: tasksData } = await TasksService.getAllTasks(user.id, isAdmin)
      setTasks(tasksData || [])
    } catch (error) {
      console.error('[loadData] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = selectedProjectId
    ? tasks.filter(t => getTaskProjectId(t) === selectedProjectId)
    : tasks

  // Calcular contadores por estado (usando tareas filtradas)
  const taskCounts = {
    created: filteredTasks.filter((t) => t.status === 'created').length,
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress').length,
    paused: filteredTasks.filter((t) => t.status === 'paused').length,
    cancelled: filteredTasks.filter((t) => t.status === 'cancelled').length,
    completed: filteredTasks.filter((t) => t.status === 'completed').length,
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleViewTask = (task: Task) => {
    setViewingTask(task)
    setIsTaskDetailModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setIsProjectModalOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsProjectModalOpen(true)
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!user) return

    try {
      // Convertir fechas si vienen como strings del modal
      const startDate = (taskData as any).startDate
        ? ((taskData as any).startDate instanceof Date ? (taskData as any).startDate : new Date((taskData as any).startDate))
        : undefined
      const endDate = (taskData as any).endDate
        ? ((taskData as any).endDate instanceof Date ? (taskData as any).endDate : new Date((taskData as any).endDate))
        : undefined

      const projectId = getTaskProjectId(taskData)

      if (taskData.id) {
        // Actualizar tarea existente
        const { data } = await TasksService.updateTask(taskData.id, {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          label: taskData.label,
          projectId,
          startDate,
          endDate,
          subtasks: taskData.subtasks,
        })

        if (data) {
          // @ts-ignore - Supabase generated types issue
          setTasks(prev => prev.map(t => t.id === data.id ? data : t))
        }
      } else {
        // Crear nueva tarea
        const { data } = await TasksService.createTask({
          title: taskData.title!,
          description: taskData.description,
          status: taskData.status,
          label: taskData.label,
          projectId,
          startDate,
          endDate,
          subtasks: taskData.subtasks,
        }, user.id)

        if (data) {
          setTasks(prev => [data, ...prev])
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (!user) return

    try {
      if (projectData.id) {
        // Actualizar proyecto existente
        const { data } = await ProjectsService.updateProject(projectData.id, {
          name: projectData.name,
          description: projectData.description,
          color: projectData.color,
        })

        if (data) {
          // @ts-ignore - Supabase generated types issue
          setProjects(prev => prev.map(p => p.id === data.id ? data : p))
        }
      } else {
        // Crear nuevo proyecto
        const { data } = await ProjectsService.createProject({
          name: projectData.name!,
          description: projectData.description,
          color: projectData.color,
        }, user.id)

        if (data) {
          // Agregar al estado local
          setProjects(prev => [data, ...prev])

          // Si es el primer proyecto, seleccionarlo automáticamente
          if (projects.length === 0) {
            // @ts-ignore - Supabase generated types issue
            setSelectedProjectId(data.id)
          }
        }
      }
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await TasksService.deleteTask(taskId)

      if (!error) {
        // Eliminar del estado local
        setTasks(prev => prev.filter(t => t.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      const { data } = await TasksService.updateTaskStatus(taskId, newStatus)

      if (data) {
        // @ts-ignore - Supabase generated types issue
        setTasks(prev => prev.map(t => t.id === data.id ? data : t))
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await ProjectsService.deleteProject(projectId)

      if (!error) {
        // Eliminar del estado local
        setProjects(prev => prev.filter(p => p.id !== projectId))

        // Desasociar tareas del proyecto (actualizar en estado local)
        setTasks(prev => prev.map(t =>
          getTaskProjectId(t) === projectId
            ? { ...t, project_id: null } as Task
            : t
        ))

        // Si era el proyecto seleccionado, deseleccionarlo
        if (selectedProjectId === projectId) {
          setSelectedProjectId(null)
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onNewTask={handleNewTask}
      onNewProject={handleNewProject}
      taskCounts={taskCounts}
      projects={projects}
      tasks={tasks}
      selectedProjectId={selectedProjectId}
      onSelectProject={handleSelectProject}
      onEditProject={handleEditProject}
      onDeleteProject={handleDeleteProject}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {currentView === 'list' && (
        <ListView
          tasks={filteredTasks}
          onEditTask={handleViewTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {currentView === 'kanban' && (
        <KanbanView
          tasks={filteredTasks}
          onEditTask={handleViewTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarView
          tasks={filteredTasks}
          onEditTask={handleViewTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        projects={projects}
        currentProjectId={selectedProjectId}
      />

      <TaskDetailModal
        open={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        task={viewingTask}
        projects={projects}
        onEdit={handleEditTask}
      />

      <ProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />
    </Layout>
  )
}
