import Dexie, { type EntityTable } from 'dexie';
import type { Task, Comment, Project, Sprint } from './types';

const db = new Dexie('MiniTasksDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  comments: EntityTable<Comment, 'id'>;
  projects: EntityTable<Project, 'id'>;
  sprints: EntityTable<Sprint, 'id'>;
};

db.version(1).stores({
  tasks: 'id, title, status, rangeId, createdAt, startDate, endDate',
  comments: 'id, taskId, createdAt',
  ranges: 'id, name, startDate, endDate, createdAt'
});

// Nueva versión con proyectos, sprints y recurrencia
db.version(2).stores({
  tasks: 'id, title, status, projectId, sprintId, createdAt, startDate, endDate, isRecurring',
  comments: 'id, taskId, createdAt',
  projects: 'id, name, createdAt',
  sprints: 'id, name, projectId, startDate, endDate, createdAt'
}).upgrade(trans => {
  // Migrar tareas existentes
  return trans.table('tasks').toCollection().modify(task => {
    task.projectId = null;
    task.sprintId = null;
    task.isRecurring = false;
    task.recurrence = null;
  });
});

// Versión 3: Sprints globales con múltiples proyectos
db.version(3).stores({
  tasks: 'id, title, status, projectId, sprintId, createdAt, startDate, endDate, isRecurring',
  comments: 'id, taskId, createdAt',
  projects: 'id, name, createdAt',
  sprints: 'id, name, startDate, endDate, createdAt' // Removemos projectId del índice
}).upgrade(trans => {
  // Migrar sprints existentes para convertir projectId string a array
  return trans.table('sprints').toCollection().modify(sprint => {
    if (sprint.projectId && typeof sprint.projectId === 'string') {
      sprint.projectIds = [sprint.projectId];
      delete sprint.projectId;
    } else if (!sprint.projectIds) {
      sprint.projectIds = [];
    }
  });
});

// Versión 4: Agregar estado y orden a sprints
db.version(4).stores({
  tasks: 'id, title, status, projectId, sprintId, createdAt, startDate, endDate, isRecurring',
  comments: 'id, taskId, createdAt',
  projects: 'id, name, createdAt',
  sprints: 'id, name, status, order, startDate, endDate, createdAt'
}).upgrade(async trans => {
  // Agregar campos status y order a sprints existentes
  const allSprints = await trans.table('sprints').toArray()
  for (let i = 0; i < allSprints.length; i++) {
    const sprint = allSprints[i]
    await trans.table('sprints').update(sprint.id, {
      status: sprint.status || 'pending',
      order: sprint.order !== undefined ? sprint.order : i
    })
  }
});

// Versión 5: Agregar time tracking a tareas
db.version(5).stores({
  tasks: 'id, title, status, projectId, sprintId, createdAt, startDate, endDate, isRecurring',
  comments: 'id, taskId, createdAt',
  projects: 'id, name, createdAt',
  sprints: 'id, name, status, order, startDate, endDate, createdAt'
}).upgrade(async trans => {
  // Agregar timeTracking a tareas existentes
  const allTasks = await trans.table('tasks').toArray()
  for (const task of allTasks) {
    if (!task.timeTracking) {
      await trans.table('tasks').update(task.id, {
        timeTracking: {
          trackedMinutes: 0,
          isRunning: false,
          sessions: []
        }
      })
    }
  }
});

// Versión 6: Limpiar campos de recurrencia y time tracking, agregar etiquetas
db.version(6).stores({
  tasks: 'id, title, status, label, projectId, sprintId, createdAt, startDate, endDate',
  comments: 'id, taskId, createdAt',
  projects: 'id, name, createdAt',
  sprints: 'id, name, status, order, startDate, endDate, createdAt'
}).upgrade(async trans => {
  // Limpiar campos obsoletos de tareas existentes
  const allTasks = await trans.table('tasks').toArray()
  for (const task of allTasks) {
    await trans.table('tasks').update(task.id, {
      isRecurring: undefined,
      recurrence: undefined,
      parentTaskId: undefined,
      timeTracking: undefined
    })
  }
});

export { db };
