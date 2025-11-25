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
  userId: string;
  userName: string;
  parentCommentId?: string | null; // Para respuestas anidadas
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[]; // Respuestas anidadas (calculado en frontend)
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
    color: 'text-gray-700 dark:text-gray-200',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  in_progress: {
    label: 'En Proceso',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40'
  },
  paused: {
    label: 'En Revisión',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/40'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40'
  },
  completed: {
    label: 'Finalizado',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40'
  }
};

export const LABEL_CONFIG: Record<TaskLabel, { label: string; color: string; bgColor: string; icon: string }> = {
  bug: {
    label: 'Bug',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    icon: '🐛'
  },
  implementacion: {
    label: 'Implementación',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    icon: '⚙️'
  },
  mejora: {
    label: 'Mejora',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    icon: '✨'
  },
  actualizacion: {
    label: 'Actualización',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    icon: '🔄'
  },
  otro: {
    label: 'Otro',
    color: 'text-gray-700 dark:text-gray-200',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: '📌'
  }
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string; icon: string }> = {
  alta: {
    label: 'Alta',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    icon: '🔴'
  },
  media: {
    label: 'Media',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
    icon: '🟡'
  },
  baja: {
    label: 'Baja',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    icon: '🟢'
  }
};
