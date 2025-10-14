// مكتبة استيراد المهام - تم إنشاؤها حديثاً
import type { Board, Task } from '@/types';

export interface ImportResult {
  tasks: Task[];
  boards: Board[];
}

// تحليل ملف JSON كامل
export function parseJSONTasks(jsonString: string, existingBoards: Board[]): ImportResult {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data || typeof data !== 'object') {
      throw new Error('الملف لا يحتوي على بيانات صالحة');
    }

    const result: ImportResult = {
      tasks: [],
      boards: []
    };

    // معالجة الأقسام
    if (Array.isArray(data.boards)) {
      result.boards = data.boards.map((board: any, index: number) => ({
        id: board.id || `imported-board-${Date.now()}-${index}`,
        title: board.title || `قسم مستورد ${index + 1}`,
        order: board.order ?? existingBoards.length + index,
        createdAt: board.createdAt || new Date().toISOString(),
        parentId: board.parentId,
        collapsed: board.collapsed || false,
      }));
    }

    // معالجة المهام
    if (Array.isArray(data.tasks)) {
      result.tasks = data.tasks.map((task: any, index: number) => {
        // البحث عن القسم المناسب
        let boardId = task.boardId;
        if (boardId && result.boards.length > 0) {
          const boardExists = result.boards.find(b => b.id === boardId);
          if (!boardExists) {
            // إذا لم يوجد القسم، استخدم أول قسم متاح
            boardId = result.boards[0].id;
          }
        } else if (existingBoards.length > 0) {
          boardId = existingBoards[0].id;
        } else {
          throw new Error('لا توجد أقسام متاحة');
        }

        return {
          id: task.id || `imported-task-${Date.now()}-${index}`,
          title: task.title || `مهمة مستوردة ${index + 1}`,
          description: task.description || undefined,
          status: (['working', 'waiting', 'frozen', 'completed'].includes(task.status)) 
            ? task.status as Task['status'] 
            : 'waiting',
          priority: (['high', 'medium', 'low'].includes(task.priority)) 
            ? task.priority as Task['priority'] 
            : 'medium',
          tags: Array.isArray(task.tags) ? task.tags : [],
          dueDate: task.dueDate || undefined,
          boardId,
          createdAt: task.createdAt || new Date().toISOString(),
          completedAt: task.completedAt || undefined,
          order: task.order ?? index,
          archived: task.archived || false,
          archivedAt: task.archivedAt || undefined,
        };
      });
    }

    if (result.tasks.length === 0 && result.boards.length === 0) {
      throw new Error('لم يتم العثور على مهام أو أقسام في الملف');
    }

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('ملف JSON غير صالح');
    }
    throw error;
  }
}

// تحليل ملف CSV متقدم
export function parseAdvancedCSV(csvString: string, defaultBoardId: string): Task[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('ملف CSV يجب أن يحتوي على رأس وصف واحد على الأقل');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const tasks: Task[] = [];

  // البحث عن أعمدة مطلوبة
  const titleIndex = headers.findIndex(h => 
    h.includes('عنوان') || h.includes('title') || h.includes('name')
  );
  
  if (titleIndex === -1) {
    throw new Error('لم يتم العثور على عمود العنوان');
  }

  const descriptionIndex = headers.findIndex(h => 
    h.includes('وصف') || h.includes('description') || h.includes('desc')
  );
  
  const priorityIndex = headers.findIndex(h => 
    h.includes('أولوية') || h.includes('priority') || h.includes('prio')
  );
  
  const dueDateIndex = headers.findIndex(h => 
    h.includes('استحقاق') || h.includes('due') || h.includes('deadline')
  );
  
  const tagsIndex = headers.findIndex(h => 
    h.includes('وسوم') || h.includes('tags') || h.includes('labels')
  );
  
  const statusIndex = headers.findIndex(h => 
    h.includes('حالة') || h.includes('status') || h.includes('state')
  );

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values[titleIndex]) {
      const task: Task = {
        id: `imported-task-${Date.now()}-${i}`,
        title: values[titleIndex],
        description: descriptionIndex !== -1 ? values[descriptionIndex] : undefined,
        status: (statusIndex !== -1 && values[statusIndex]) 
          ? (['working', 'waiting', 'frozen', 'completed'].includes(values[statusIndex]) 
              ? values[statusIndex] as Task['status'] 
              : 'waiting')
          : 'waiting',
        priority: (priorityIndex !== -1 && values[priorityIndex]) 
          ? (['high', 'medium', 'low'].includes(values[priorityIndex]) 
              ? values[priorityIndex] as Task['priority'] 
              : 'medium')
          : 'medium',
        tags: (tagsIndex !== -1 && values[tagsIndex]) 
          ? values[tagsIndex].split(';').map(t => t.trim()).filter(t => t)
          : [],
        dueDate: (dueDateIndex !== -1 && values[dueDateIndex]) 
          ? new Date(values[dueDateIndex]).toISOString() 
          : undefined,
        boardId: defaultBoardId,
        createdAt: new Date().toISOString(),
        order: i - 1,
      };

      tasks.push(task);
    }
  }

  return tasks;
}

// تحليل ملف نصي متقدم
export function parseAdvancedText(text: string, defaultBoardId: string): Task[] {
  const lines = text.trim().split('\n').filter(line => line.trim());
  const tasks: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // تحليل السطر باستخدام regex متقدم
    const titleMatch = line.match(/^(.+?)(?:\s+!(\w+))?(?:\s+@([\d-]+))?(?:\s+#(.+))?$/);
    
    if (titleMatch) {
      const [, title, priority, dueDate, tags] = titleMatch;
      
      const task: Task = {
        id: `imported-task-${Date.now()}-${i}`,
        title: title.trim(),
        status: 'waiting',
        priority: (priority && ['high', 'medium', 'low'].includes(priority)) 
          ? priority as Task['priority'] 
          : 'medium',
        tags: tags ? tags.split(/\s+/).map(t => t.replace('#', '').trim()).filter(t => t) : [],
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        boardId: defaultBoardId,
        createdAt: new Date().toISOString(),
        order: i,
      };

      tasks.push(task);
    }
  }

  return tasks;
}

// التحقق من صحة البيانات المستوردة
export function validateImportedData(data: ImportResult): string[] {
  const errors: string[] = [];

  // التحقق من الأقسام
  data.boards.forEach((board, index) => {
    if (!board.title || board.title.trim() === '') {
      errors.push(`القسم ${index + 1}: العنوان مطلوب`);
    }
    if (!board.id || board.id.trim() === '') {
      errors.push(`القسم ${index + 1}: المعرف مطلوب`);
    }
  });

  // التحقق من المهام
  data.tasks.forEach((task, index) => {
    if (!task.title || task.title.trim() === '') {
      errors.push(`المهمة ${index + 1}: العنوان مطلوب`);
    }
    if (!task.boardId || task.boardId.trim() === '') {
      errors.push(`المهمة ${index + 1}: معرف القسم مطلوب`);
    }
    if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) {
      errors.push(`المهمة ${index + 1}: تاريخ الاستحقاق غير صالح`);
    }
  });

  return errors;
}
