// دوال نسخ المهام إلى الحافظة
import type { Task, Board } from '@/types';

// تنسيق المهمة كنص
export function formatTaskAsText(task: Task, index?: number): string {
  const prefix = index !== undefined ? `${index}. ` : '• ';
  let text = `${prefix}${task.title}\n`;
  
  if (task.description) {
    text += `   الوصف: ${task.description}\n`;
  }
  
  const statusLabels: Record<Task['status'], string> = {
    working: 'قيد العمل',
    waiting: 'بانتظار',
    frozen: 'مجمّد',
    completed: 'مكتمل ✓',
  };
  
  const priorityLabels: Record<Task['priority'], string> = {
    high: 'عالية 🔴',
    medium: 'متوسطة 🟡',
    low: 'منخفضة 🟢',
  };
  
  text += `   الحالة: ${statusLabels[task.status]}\n`;
  text += `   الأولوية: ${priorityLabels[task.priority]}\n`;
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    text += `   موعد الاستحقاق: ${dueDate}\n`;
  }
  
  if (task.tags.length > 0) {
    text += `   الوسوم: ${task.tags.join(', ')}\n`;
  }
  
  return text;
}

// نسخ مهام قسم معين
export async function copyBoardTasks(
  boardTitle: string,
  tasks: Task[]
): Promise<boolean> {
  try {
    if (tasks.length === 0) {
      return false;
    }

    let clipboardText = `📋 قسم: ${boardTitle}\n`;
    clipboardText += `عدد المهام: ${tasks.length}\n`;
    clipboardText += '═══════════════════════════════════\n\n';

    tasks.forEach((task, index) => {
      clipboardText += formatTaskAsText(task, index + 1);
      clipboardText += '\n';
    });

    clipboardText += '═══════════════════════════════════\n';
    clipboardText += `تم النسخ من: مهام اليوم\n`;
    clipboardText += `التاريخ: ${new Date().toLocaleDateString('ar')}\n`;

    await navigator.clipboard.writeText(clipboardText);
    return true;
  } catch (error) {
    console.error('خطأ في نسخ المهام:', error);
    return false;
  }
}

// نسخ كل المهام من كل الأقسام
export async function copyAllTasks(
  boards: Board[],
  tasks: Task[]
): Promise<boolean> {
  try {
    if (tasks.length === 0) {
      return false;
    }

    let clipboardText = `📋 جميع المهام - مهام اليوم\n`;
    clipboardText += `إجمالي المهام: ${tasks.length}\n`;
    clipboardText += `عدد الأقسام: ${boards.length}\n`;
    clipboardText += '═══════════════════════════════════\n\n';

    boards.forEach((board) => {
      const boardTasks = tasks.filter((t) => t.boardId === board.id);
      
      if (boardTasks.length > 0) {
        clipboardText += `\n## ${board.title} (${boardTasks.length} مهمة)\n`;
        clipboardText += '─────────────────────────────────\n\n';

        boardTasks.forEach((task, index) => {
          clipboardText += formatTaskAsText(task, index + 1);
          clipboardText += '\n';
        });
      }
    });

    clipboardText += '\n═══════════════════════════════════\n';
    clipboardText += `تم النسخ من: مهام اليوم\n`;
    clipboardText += `التاريخ: ${new Date().toLocaleDateString('ar')}\n`;
    clipboardText += `الوقت: ${new Date().toLocaleTimeString('ar')}\n`;

    await navigator.clipboard.writeText(clipboardText);
    return true;
  } catch (error) {
    console.error('خطأ في نسخ كل المهام:', error);
    return false;
  }
}

// نسخ مهام محددة بناءً على الفلاتر
export async function copyFilteredTasks(
  tasks: Task[],
  filterDescription: string
): Promise<boolean> {
  try {
    if (tasks.length === 0) {
      return false;
    }

    let clipboardText = `📋 المهام المفلترة\n`;
    clipboardText += `${filterDescription}\n`;
    clipboardText += `عدد المهام: ${tasks.length}\n`;
    clipboardText += '═══════════════════════════════════\n\n';

    tasks.forEach((task, index) => {
      clipboardText += formatTaskAsText(task, index + 1);
      clipboardText += '\n';
    });

    clipboardText += '═══════════════════════════════════\n';
    clipboardText += `تم النسخ من: مهام اليوم\n`;
    clipboardText += `التاريخ: ${new Date().toLocaleDateString('ar')}\n`;

    await navigator.clipboard.writeText(clipboardText);
    return true;
  } catch (error) {
    console.error('خطأ في نسخ المهام المفلترة:', error);
    return false;
  }
}