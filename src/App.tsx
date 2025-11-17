import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout, type ViewType } from './components/Layout'
import { TaskModal } from './components/TaskModal'
import { TaskDetailModal } from './components/TaskDetailModal'
import { ProjectModal } from './components/ProjectModal'
import { ListView } from './components/views/ListView'
import { KanbanView } from './components/views/KanbanView'
import { CalendarView } from './components/views/CalendarView'
import { db } from './lib/db'
import type { Task, TaskStatus, Project } from './lib/types'
import { useTheme } from './hooks/useTheme'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Cargar datos desde IndexedDB
  const tasks = useLiveQuery(() => db.tasks.toArray()) || []
  const projects = useLiveQuery(() => db.projects.toArray()) || []

  // Filtrar tareas por proyecto seleccionado
  const filteredTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId)
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
    try {
      if (taskData.id) {
        // Actualizar tarea existente
        await db.tasks.update(taskData.id, taskData)
      } else {
        // Crear nueva tarea
        const newTask: Task = {
          id: Date.now().toString(),
          title: taskData.title!,
          description: taskData.description,
          status: taskData.status || 'created',
          label: taskData.label,
          subtasks: taskData.subtasks || [],
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          projectId: taskData.projectId || null,
          images: taskData.images || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.tasks.add(newTask)
      }
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleSaveProject = async (projectData: Partial<Project>) => {
    try {
      if (projectData.id) {
        await db.projects.update(projectData.id, projectData)
      } else {
        const newProject: Project = {
          id: Date.now().toString(),
          name: projectData.name!,
          description: projectData.description,
          color: projectData.color,
          createdAt: new Date(),
        }
        await db.projects.add(newProject)

        // Si es el primer proyecto, seleccionarlo automáticamente
        if (projects.length === 0) {
          setSelectedProjectId(newProject.id)
        }
      }
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await db.tasks.delete(taskId)
      // También eliminar comentarios asociados
      await db.comments.where('taskId').equals(taskId).delete()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    try {
      await db.tasks.update(taskId, {
        status: newStatus,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Desasociar tareas del proyecto (no las eliminamos)
      const projectTasks = tasks.filter(t => t.projectId === projectId)
      for (const task of projectTasks) {
        await db.tasks.update(task.id, { projectId: null })
      }

      await db.projects.delete(projectId)

      // Si era el proyecto seleccionado, deseleccionarlo
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId)
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

export default App
