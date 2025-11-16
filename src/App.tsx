import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout, type ViewType } from './components/Layout'
import { TaskModal } from './components/TaskModal'
import { TaskDetailModal } from './components/TaskDetailModal'
import { ProjectModal } from './components/ProjectModal'
import { SprintModal } from './components/SprintModal'
import { ListView } from './components/views/ListView'
import { KanbanView } from './components/views/KanbanView'
import { CalendarView } from './components/views/CalendarView'
import { db } from './lib/db'
import type { Task, TaskStatus, Project, Sprint } from './lib/types'
import { useTheme } from './hooks/useTheme'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Cargar datos desde IndexedDB
  const tasks = useLiveQuery(() => db.tasks.toArray()) || []
  const projects = useLiveQuery(() => db.projects.toArray()) || []
  const sprints = useLiveQuery(() => db.sprints.toArray()) || []

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

  const handleNewSprint = () => {
    setEditingSprint(null)
    setIsSprintModalOpen(true)
  }

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint)
    setIsSprintModalOpen(true)
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
          sprintId: taskData.sprintId || null,
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

  const handleSaveSprint = async (sprintData: Partial<Sprint>) => {
    try {
      if (sprintData.id) {
        await db.sprints.update(sprintData.id, sprintData)
      } else {
        // Obtener el máximo order actual
        const allSprints = await db.sprints.toArray()
        const maxOrder = allSprints.length > 0
          ? Math.max(...allSprints.map(s => s.order || 0))
          : -1

        const newSprint: Sprint = {
          id: Date.now().toString(),
          name: sprintData.name!,
          description: sprintData.description,
          projectIds: sprintData.projectIds || [],
          startDate: sprintData.startDate!,
          endDate: sprintData.endDate!,
          status: 'pending',
          order: maxOrder + 1,
          createdAt: new Date(),
        }
        await db.sprints.add(newSprint)
      }
    } catch (error) {
      console.error('Error saving sprint:', error)
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
      // Actualizar sprints que incluyen este proyecto
      const affectedSprints = sprints.filter(s => s.projectIds.includes(projectId))
      for (const sprint of affectedSprints) {
        const newProjectIds = sprint.projectIds.filter(id => id !== projectId)
        await db.sprints.update(sprint.id, { projectIds: newProjectIds })
      }

      // Desasociar tareas del proyecto (no las eliminamos)
      const projectTasks = tasks.filter(t => t.projectId === projectId)
      for (const task of projectTasks) {
        await db.tasks.update(task.id, { projectId: null, sprintId: null })
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

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      // Desasociar tareas del sprint
      const sprintTasks = tasks.filter(t => t.sprintId === sprintId)
      for (const task of sprintTasks) {
        await db.tasks.update(task.id, { sprintId: null })
      }

      await db.sprints.delete(sprintId)
    } catch (error) {
      console.error('Error deleting sprint:', error)
    }
  }

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      const sprint = sprints.find(s => s.id === sprintId)
      if (!sprint) return

      // Marcar sprint como completado
      await db.sprints.update(sprintId, { status: 'completed' })

      // Encontrar el siguiente sprint pendiente con el mismo conjunto de proyectos
      const nextSprint = sprints
        .filter(s =>
          s.status === 'pending' &&
          s.order > sprint.order &&
          s.projectIds.some(pid => sprint.projectIds.includes(pid))
        )
        .sort((a, b) => a.order - b.order)[0]

      if (nextSprint) {
        // Activar el siguiente sprint
        await db.sprints.update(nextSprint.id, { status: 'active' })

        // Mover tareas incompletas al siguiente sprint
        const incompleteTasks = tasks.filter(t =>
          t.sprintId === sprintId &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
        )

        for (const task of incompleteTasks) {
          await db.tasks.update(task.id, { sprintId: nextSprint.id })
        }
      }
    } catch (error) {
      console.error('Error completing sprint:', error)
    }
  }

  const handleActivateSprint = async (sprintId: string) => {
    try {
      await db.sprints.update(sprintId, { status: 'active' })
    } catch (error) {
      console.error('Error activating sprint:', error)
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
      onNewSprint={handleNewSprint}
      taskCounts={taskCounts}
      projects={projects}
      sprints={sprints}
      tasks={tasks}
      selectedProjectId={selectedProjectId}
      onSelectProject={handleSelectProject}
      onEditProject={handleEditProject}
      onDeleteProject={handleDeleteProject}
      onEditSprint={handleEditSprint}
      onDeleteSprint={handleDeleteSprint}
      onCompleteSprint={handleCompleteSprint}
      onActivateSprint={handleActivateSprint}
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
        sprints={sprints}
        currentProjectId={selectedProjectId}
      />

      <TaskDetailModal
        open={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        task={viewingTask}
        projects={projects}
        sprints={sprints}
        onEdit={handleEditTask}
      />

      <ProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />

      <SprintModal
        open={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleSaveSprint}
        sprint={editingSprint}
        projects={projects}
        currentProjectId={selectedProjectId || undefined}
      />
    </Layout>
  )
}

export default App
