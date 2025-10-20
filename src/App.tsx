import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout, type ViewType } from './components/Layout'
import { TaskModal } from './components/TaskModal'
import { ListView } from './components/views/ListView'
import { KanbanView } from './components/views/KanbanView'
import { CalendarView } from './components/views/CalendarView'
import { db } from './lib/db'
import type { Task, TaskStatus } from './lib/types'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Cargar tareas desde IndexedDB
  const tasks = useLiveQuery(() => db.tasks.toArray()) || []
  const ranges = useLiveQuery(() => db.ranges.toArray()) || []

  // Calcular contadores por estado
  const taskCounts = {
    created: tasks.filter((t) => t.status === 'created').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    paused: tasks.filter((t) => t.status === 'paused').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
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
          subtasks: taskData.subtasks || [],
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          rangeId: taskData.rangeId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.tasks.add(newTask)
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Error al guardar la tarea')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await db.tasks.delete(taskId)
      // También eliminar comentarios asociados
      await db.comments.where('taskId').equals(taskId).delete()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error al eliminar la tarea')
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
      alert('Error al actualizar el estado de la tarea')
    }
  }

  const handleCloseModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onNewTask={handleNewTask}
      taskCounts={taskCounts}
    >
      {currentView === 'list' && (
        <ListView
          tasks={tasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {currentView === 'kanban' && (
        <KanbanView
          tasks={tasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarView
          tasks={tasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <TaskModal
        open={isTaskModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
        ranges={ranges}
      />
    </Layout>
  )
}

export default App
