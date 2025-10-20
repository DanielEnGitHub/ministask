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

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // cada X días/semanas/meses
  daysOfWeek?: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado (solo para weekly)
  endDate?: Date; // cuando termina la recurrencia
  endAfterOccurrences?: number; // o después de N ocurrencias
}

export interface TimeTracking {
  estimatedMinutes?: number; // Tiempo estimado en minutos
  trackedMinutes: number; // Tiempo acumulado en minutos
  isRunning: boolean; // Si el timer está corriendo actualmente
  startTime?: Date; // Cuando se inició el timer actual
  sessions: TimeSession[]; // Historial de sesiones de trabajo
}

export interface TimeSession {
  id: string;
  startTime: Date;
  endTime?: Date; // Si no hay endTime, la sesión está activa
  minutes: number; // Duración en minutos
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  subtasks: SubTask[];
  startDate?: Date;
  endDate?: Date;
  projectId?: string | null;
  sprintId?: string | null;
  isRecurring: boolean;
  recurrence?: RecurrenceConfig | null;
  parentTaskId?: string | null; // para tareas generadas por recurrencia
  timeTracking?: TimeTracking; // Sistema de tracking de tiempo
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
}

export type SprintStatus = 'pending' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  projectIds: string[]; // Ahora un sprint puede pertenecer a múltiples proyectos
  startDate: Date;
  endDate: Date;
  status: SprintStatus; // Estado del sprint
  order: number; // Orden en la cola de sprints
  createdAt: Date;
}

export const SPRINT_STATUS_CONFIG: Record<SprintStatus, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  active: {
    label: 'Activo',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  completed: {
    label: 'Completado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  }
};

// Mantenemos TaskRange por compatibilidad (deprecated)
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
