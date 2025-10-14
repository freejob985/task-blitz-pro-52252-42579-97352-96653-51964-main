// مكتبة قاعدة البيانات IndexedDB مع fallback إلى localStorage
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { AppData, Board, Task, FocusSession, AppSettings } from '@/types';

interface TasksDB extends DBSchema {
  boards: {
    key: string;
    value: Board;
    indexes: { 'by-order': number };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-board': string; 'by-order': number };
  };
  sessions: {
    key: string;
    value: FocusSession;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'daily-tasks-db';
const DB_VERSION = 1;

let db: IDBPDatabase<TasksDB> | null = null;

// تهيئة قاعدة البيانات
export async function initDB(): Promise<void> {
  try {
    db = await openDB<TasksDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // إنشاء جداول
        if (!db.objectStoreNames.contains('boards')) {
          const boardStore = db.createObjectStore('boards', { keyPath: 'id' });
          boardStore.createIndex('by-order', 'order');
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-board', 'boardId');
          taskStore.createIndex('by-order', 'order');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
    
    // تهيئة الإعدادات الافتراضية إذا لم تكن موجودة
    const settings = await getSettings();
    if (!settings) {
      await saveSettings({
        soundsEnabled: true,
        notificationsEnabled: true,
        theme: 'light',
        currentSound: 'default',
      });
    }
  } catch (error) {
    console.error('فشل تهيئة IndexedDB، استخدام localStorage:', error);
  }
}

// حفظ واستعادة من localStorage كـ fallback
function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('فشل الحفظ في localStorage:', error);
  }
}

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('فشل التحميل من localStorage:', error);
    return null;
  }
}

// وظائف الأقسام (Boards)
export async function getAllBoards(): Promise<Board[]> {
  try {
    if (db) {
      return await db.getAllFromIndex('boards', 'by-order');
    }
    return loadFromLocalStorage<Board[]>('boards') || [];
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
    return [];
  }
}

export async function saveBoard(board: Board): Promise<void> {
  try {
    if (db) {
      await db.put('boards', board);
    } else {
      const boards = loadFromLocalStorage<Board[]>('boards') || [];
      const index = boards.findIndex(b => b.id === board.id);
      if (index >= 0) boards[index] = board;
      else boards.push(board);
      saveToLocalStorage('boards', boards);
    }
  } catch (error) {
    console.error('خطأ في حفظ القسم:', error);
  }
}

export async function deleteBoard(id: string): Promise<void> {
  try {
    if (db) {
      await db.delete('boards', id);
    } else {
      const boards = loadFromLocalStorage<Board[]>('boards') || [];
      saveToLocalStorage('boards', boards.filter(b => b.id !== id));
    }
  } catch (error) {
    console.error('خطأ في حذف القسم:', error);
  }
}

// وظائف المهام (Tasks)
export async function getAllTasks(): Promise<Task[]> {
  try {
    if (db) {
      const allTasks = await db.getAll('tasks');
      return allTasks.filter(t => !t.archived);
    }
    const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
    return tasks.filter(t => !t.archived);
  } catch (error) {
    console.error('خطأ في تحميل المهام:', error);
    return [];
  }
}

export async function getArchivedTasks(): Promise<Task[]> {
  try {
    if (db) {
      const allTasks = await db.getAll('tasks');
      return allTasks.filter(t => t.archived === true);
    }
    const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
    return tasks.filter(t => t.archived === true);
  } catch (error) {
    console.error('خطأ في تحميل المهام المؤرشفة:', error);
    return [];
  }
}

export async function archiveTask(id: string): Promise<void> {
  try {
    if (db) {
      const task = await db.get('tasks', id);
      if (task) {
        task.archived = true;
        task.archivedAt = new Date().toISOString();
        await db.put('tasks', task);
      }
    } else {
      const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex >= 0) {
        tasks[taskIndex].archived = true;
        tasks[taskIndex].archivedAt = new Date().toISOString();
        saveToLocalStorage('tasks', tasks);
      }
    }
  } catch (error) {
    console.error('خطأ في أرشفة المهمة:', error);
  }
}

export async function unarchiveTask(id: string): Promise<void> {
  try {
    if (db) {
      const task = await db.get('tasks', id);
      if (task) {
        task.archived = false;
        task.archivedAt = undefined;
        await db.put('tasks', task);
      }
    } else {
      const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex >= 0) {
        tasks[taskIndex].archived = false;
        tasks[taskIndex].archivedAt = undefined;
        saveToLocalStorage('tasks', tasks);
      }
    }
  } catch (error) {
    console.error('خطأ في استعادة المهمة:', error);
  }
}

export async function getTasksByBoard(boardId: string): Promise<Task[]> {
  try {
    if (db) {
      return await db.getAllFromIndex('tasks', 'by-board', boardId);
    }
    const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
    return tasks.filter(t => t.boardId === boardId);
  } catch (error) {
    console.error('خطأ في تحميل مهام القسم:', error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<void> {
  try {
    if (db) {
      await db.put('tasks', task);
    } else {
      const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
      const index = tasks.findIndex(t => t.id === task.id);
      if (index >= 0) tasks[index] = task;
      else tasks.push(task);
      saveToLocalStorage('tasks', tasks);
    }
  } catch (error) {
    console.error('خطأ في حفظ المهمة:', error);
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    if (db) {
      await db.delete('tasks', id);
    } else {
      const tasks = loadFromLocalStorage<Task[]>('tasks') || [];
      saveToLocalStorage('tasks', tasks.filter(t => t.id !== id));
    }
  } catch (error) {
    console.error('خطأ في حذف المهمة:', error);
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    if (db) {
      const tx = db.transaction('tasks', 'readwrite');
      await Promise.all(tasks.map(task => tx.store.put(task)));
      await tx.done;
    } else {
      const allTasks = loadFromLocalStorage<Task[]>('tasks') || [];
      tasks.forEach(task => {
        const index = allTasks.findIndex(t => t.id === task.id);
        if (index >= 0) allTasks[index] = task;
        else allTasks.push(task);
      });
      saveToLocalStorage('tasks', allTasks);
    }
  } catch (error) {
    console.error('خطأ في حفظ المهام:', error);
  }
}

// وظائف الجلسات
export async function getAllSessions(): Promise<FocusSession[]> {
  try {
    if (db) {
      return await db.getAll('sessions');
    }
    return loadFromLocalStorage<FocusSession[]>('sessions') || [];
  } catch (error) {
    console.error('خطأ في تحميل الجلسات:', error);
    return [];
  }
}

export async function saveSession(session: FocusSession): Promise<void> {
  try {
    if (db) {
      await db.put('sessions', session);
    } else {
      const sessions = loadFromLocalStorage<FocusSession[]>('sessions') || [];
      const index = sessions.findIndex(s => s.id === session.id);
      if (index >= 0) sessions[index] = session;
      else sessions.push(session);
      saveToLocalStorage('sessions', sessions);
    }
  } catch (error) {
    console.error('خطأ في حفظ الجلسة:', error);
  }
}

// وظائف الإعدادات
export async function getSettings(): Promise<AppSettings | null> {
  try {
    if (db) {
      return (await db.get('settings', 'app-settings')) || null;
    }
    return loadFromLocalStorage<AppSettings>('settings');
  } catch (error) {
    console.error('خطأ في تحميل الإعدادات:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    if (db) {
      await db.put('settings', { ...settings, id: 'app-settings' } as any);
    } else {
      saveToLocalStorage('settings', settings);
    }
  } catch (error) {
    console.error('خطأ في حفظ الإعدادات:', error);
  }
}

// تصدير واستيراد البيانات
export async function exportAllData(): Promise<AppData> {
  const [boards, tasks, sessions, settings] = await Promise.all([
    getAllBoards(),
    getAllTasks(),
    getAllSessions(),
    getSettings(),
  ]);
  
  return {
    boards,
    tasks,
    settings: settings || {
      soundsEnabled: true,
      notificationsEnabled: true,
      theme: 'light',
      currentSound: 'default',
    },
    focusSessions: sessions,
  };
}

export async function importAllData(data: AppData): Promise<void> {
  try {
    if (db) {
      const tx = db.transaction(['boards', 'tasks', 'sessions', 'settings'], 'readwrite');
      await Promise.all([
        ...data.boards.map(b => tx.objectStore('boards').put(b)),
        ...data.tasks.map(t => tx.objectStore('tasks').put(t)),
        ...data.focusSessions.map(s => tx.objectStore('sessions').put(s)),
      ]);
      await tx.objectStore('settings').put({ ...data.settings, id: 'app-settings' } as any);
      await tx.done;
    } else {
      saveToLocalStorage('boards', data.boards);
      saveToLocalStorage('tasks', data.tasks);
      saveToLocalStorage('sessions', data.focusSessions);
      saveToLocalStorage('settings', data.settings);
    }
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
    throw error;
  }
}
