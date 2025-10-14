// منطق تصدير ونسخ المهام
import type { Board, Task } from '@/types';

export interface ExportOptions {
  format: 'text' | 'json' | 'csv';
  includeDone: boolean;
  filteredOnly: boolean;
  boards?: Board[];
  tasks?: Task[];
}

// تحويل حالة المهمة إلى emoji
function getStatusEmoji(status: Task['status']): string {
  const map = {
    working: '🔄',
    waiting: '⏸️',
    frozen: '❄️',
    completed: '✅',
  };
  return map[status] || '📝';
}

// تحويل أولوية المهمة إلى emoji
function getPriorityEmoji(priority: Task['priority']): string {
  const map = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return map[priority] || '⚪';
}

// تصدير كنص منسق (Markdown-style)
export function exportAsText(options: ExportOptions): string {
  const { boards = [], tasks = [], includeDone, filteredOnly } = options;
  let output = '# مهام اليوم\n\n';

  for (const board of boards) {
    const boardTasks = tasks
      .filter(t => t.boardId === board.id)
      .filter(t => includeDone || t.status !== 'completed')
      .sort((a, b) => a.order - b.order);

    if (boardTasks.length === 0 && filteredOnly) continue;

    output += `## ${board.title} (${boardTasks.length} مهمة)\n\n`;

    for (const task of boardTasks) {
      const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
      const status = getStatusEmoji(task.status);
      const priority = getPriorityEmoji(task.priority);
      const tags = task.tags.length > 0 ? ` #${task.tags.join(' #')}` : '';
      const due = task.dueDate ? ` 📅 ${task.dueDate}` : '';
      
      output += `${checkbox} ${status} ${priority} ${task.title}${tags}${due}\n`;
      
      if (task.description) {
        output += `   ${task.description}\n`;
      }
      output += '\n';
    }
  }

  return output;
}

// تصدير كـ JSON
export function exportAsJSON(options: ExportOptions): string {
  const { boards = [], tasks = [], includeDone } = options;
  
  const filteredTasks = tasks.filter(t => includeDone || t.status !== 'completed');

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    boards,
    tasks: filteredTasks,
  }, null, 2);
}

// تصدير كـ CSV
export function exportAsCSV(options: ExportOptions): string {
  const { tasks = [], includeDone } = options;
  
  const filteredTasks = tasks.filter(t => includeDone || t.status !== 'completed');
  
  let csv = 'العنوان,الوصف,الحالة,الأولوية,الوسوم,تاريخ الاستحقاق,تاريخ الإنشاء\n';

  for (const task of filteredTasks) {
    const row = [
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      `"${task.tags.join(';')}"`,
      task.dueDate || '',
      task.createdAt,
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

// نسخ إلى الحافظة
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('فشل النسخ إلى الحافظة:', error);
    return false;
  }
}
