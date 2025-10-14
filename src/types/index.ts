// أنواع بيانات التطبيق

export type TaskStatus = 'working' | 'waiting' | 'frozen' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate?: string; // ISO string
  boardId: string;
  createdAt: string;
  completedAt?: string;
  order: number;
  archived?: boolean;
  archivedAt?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
  parentId?: string; // للدلالة على القسم الرئيسي
  collapsed?: boolean;
  color?: string;
  icon?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  category?: string;
  template?: string;
  isSubBoard?: boolean; // للدلالة على أن هذا قسم فرعي
}

export interface FocusSession {
  id: string;
  type: 'focus' | 'break';
  duration: number; // minutes
  startedAt: string;
  endedAt?: string;
  completed: boolean;
}

export interface AppSettings {
  soundsEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  currentSound: string;
}

export interface AppData {
  boards: Board[];
  tasks: Task[];
  settings: AppSettings;
  focusSessions: FocusSession[];
}
