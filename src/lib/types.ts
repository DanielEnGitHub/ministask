export type TaskStatus = 'created' | 'in_progress' | 'paused' | 'cancelled' | 'completed';

export type TaskLabel = 'bug' | 'implementacion' | 'mejora' | 'actualizacion' | 'otro';

export type TaskPriority = 'alta' | 'media' | 'baja';

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

export interface TaskView {
  id: string;
  userId: string;
  userName: string;
  viewedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  label?: TaskLabel; // Etiqueta de la tarea
  priority?: TaskPriority; // Prioridad de la tarea
  subtasks: SubTask[];
  startDate?: Date;
  endDate?: Date;
  projectId?: string | null;
  images?: string[]; // URLs o base64 de imágenes adjuntas
  taskViews?: TaskView[]; // Historial de vistas (solo para admins)
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
    label: 'En Revisión',
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

export const LABEL_CONFIG: Record<TaskLabel, { label: string; color: string; bgColor: string; icon: string }> = {
  bug: {
    label: 'Bug',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '🐛'
  },
  implementacion: {
    label: 'Implementación',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '⚙️'
  },
  mejora: {
    label: 'Mejora',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✨'
  },
  actualizacion: {
    label: 'Actualización',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '🔄'
  },
  otro: {
    label: 'Otro',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '📌'
  }
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string; icon: string }> = {
  alta: {
    label: 'Alta',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '🔴'
  },
  media: {
    label: 'Media',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '🟡'
  },
  baja: {
    label: 'Baja',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '🟢'
  }
};
