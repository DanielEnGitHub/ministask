import Dexie, { type EntityTable } from 'dexie';
import type { Task, Comment, TaskRange } from './types';

const db = new Dexie('MiniTasksDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  comments: EntityTable<Comment, 'id'>;
  ranges: EntityTable<TaskRange, 'id'>;
};

db.version(1).stores({
  tasks: 'id, title, status, rangeId, createdAt, startDate, endDate',
  comments: 'id, taskId, createdAt',
  ranges: 'id, name, startDate, endDate, createdAt'
});

export { db };
