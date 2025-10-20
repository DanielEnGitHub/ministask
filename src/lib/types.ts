export type TaskStatus = 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  taskId: string;
  text: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  subtasks: SubTask[];
  startDate?: Date;
  endDate?: Date;
  rangeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRange {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  color?: string;
  createdAt: Date;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  created: {
    label: 'Creado',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  in_progress: {
    label: 'En Proceso',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  paused: {
    label: 'Pausado',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  },
  completed: {
    label: 'Finalizado',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  }
};
