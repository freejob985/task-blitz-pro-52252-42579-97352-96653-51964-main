// منطق إضافة المهام المتعددة دفعة واحدة
import type { Task, TaskPriority } from '@/types';

export interface BulkTaskDefaults {
  boardId: string;
  status?: Task['status'];
  priority?: TaskPriority;
}

export interface ParsedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  tags: string[];
  dueDate?: string;
}

// تحليل سطر مهمة واحد
export function parseTaskLine(line: string): ParsedTask | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let title = trimmed;
  let priority: TaskPriority = 'medium';
  const tags: string[] = [];
  let dueDate: string | undefined;

  // استخراج الأولوية (!)
  const priorityMatch = trimmed.match(/!(عالية|متوسطة|منخفضة)/);
  if (priorityMatch) {
    const priorityMap: Record<string, TaskPriority> = {
      'عالية': 'high',
      'متوسطة': 'medium',
      'منخفضة': 'low',
    };
    priority = priorityMap[priorityMatch[1]];
    title = title.replace(priorityMatch[0], '').trim();
  }

  // استخراج تاريخ الاستحقاق (@)
  const dateMatch = trimmed.match(/@(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    dueDate = dateMatch[1];
    title = title.replace(dateMatch[0], '').trim();
  }

  // استخراج الوسوم (#)
  const tagMatches = trimmed.matchAll(/#([\u0600-\u06FFa-zA-Z0-9_]+)/g);
  for (const match of tagMatches) {
    tags.push(match[1]);
    title = title.replace(match[0], '').trim();
  }

  // تنظيف العنوان
  title = title.trim();
  if (!title) return null;

  return {
    title,
    priority,
    tags,
    dueDate,
  };
}

// تحليل نص متعدد الأسطر إلى مهام
export function parseLinesToTasks(
  text: string,
  defaults: BulkTaskDefaults
): Task[] {
  const lines = text.split('\n');
  const tasks: Task[] = [];
  
  for (const line of lines) {
    const parsed = parseTaskLine(line);
    if (!parsed) continue;

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: parsed.title,
      description: parsed.description,
      status: defaults.status || 'waiting',
      priority: parsed.priority,
      tags: parsed.tags,
      dueDate: parsed.dueDate,
      boardId: defaults.boardId,
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };

    tasks.push(task);
  }

  return tasks;
}

// تحليل CSV (اختياري)
export function parseCSVToTasks(
  csv: string,
  defaults: BulkTaskDefaults
): Task[] {
  const lines = csv.split('\n');
  const tasks: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    // تخطي الرأس إذا كان موجودًا
    if (i === 0 && lines[i].toLowerCase().includes('عنوان')) continue;

    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 1 || !parts[0]) continue;

    const priorityMap: Record<string, TaskPriority> = {
      'عالية': 'high',
      'high': 'high',
      'متوسطة': 'medium',
      'medium': 'medium',
      'منخفضة': 'low',
      'low': 'low',
    };

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: parts[0],
      description: parts[1] || undefined,
      status: defaults.status || 'waiting',
      priority: (parts[2] && priorityMap[parts[2].toLowerCase()]) || 'medium',
      tags: parts[4] ? parts[4].split(';').map(t => t.trim()).filter(Boolean) : [],
      dueDate: parts[3] || undefined,
      boardId: defaults.boardId,
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };

    tasks.push(task);
  }

  return tasks;
}
