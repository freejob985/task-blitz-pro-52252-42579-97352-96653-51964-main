// الصفحة الرئيسية - تطبيق مهام اليوم
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Timer, Download, Upload, Moon, Sun, Layers, Settings2, Smartphone, Copy, Bell, BellOff, Archive, FolderTree, Zap, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardColumn } from '@/components/BoardColumn';
import { TaskEditModal } from '@/components/TaskEditModal';
import { BulkAddModal } from '@/components/BulkAddModal';
import { ImportModal } from '@/components/ImportModal';
import { ExportModal } from '@/components/ExportModal';
import { ArchiveModal } from '@/components/ArchiveModal';
import { BoardManager } from '@/components/BoardManager';
import { FocusTimer, FocusTimerBadge } from '@/components/FocusTimer';
import { SearchBar, FilterState } from '@/components/SearchBar';
import { Statistics } from '@/components/Statistics';
import { StatusManagement } from '@/components/StatusManagement';
import { SplashScreen } from '@/components/SplashScreen';
import { 
  ViewModeSelector, 
  ViewMode, 
  DefaultView, 
  GridView, 
  ListView, 
  CalendarView, 
  KanbanView, 
  TableView, 
  ChartView 
} from '@/components/BoardViewModes';
import { QuickAddMode } from '@/components/QuickAddMode';
import { initDB, getAllBoards, getAllTasks, saveBoard, saveTask, saveTasks, deleteBoard, deleteTask, archiveTask, getSettings, saveSettings, deleteAllData } from '@/lib/db';
import { showToast } from '@/lib/toast';
import { playSound } from '@/lib/sounds';
import { copyAllTasks, copyFilteredTasks } from '@/lib/clipboard';
import { 
  requestNotificationPermission, 
  checkAndNotifyProgress, 
  getNotificationPermission,
  sendTestNotification,
  resetNotificationMilestones
} from '@/lib/notifications';
import type { Board, Task } from '@/types';

export default function Index() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    tags: [],
    boardId: null,
    boardCategory: null,
    showFavoritesOnly: false,
    overdue: false,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [boardManagerOpen, setBoardManagerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultBoardId, setDefaultBoardId] = useState<string>();
  const [focusedBoardId, setFocusedBoardId] = useState<string | null>(null);
  const [hiddenSubBoards, setHiddenSubBoards] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('view-mode');
    return (saved as ViewMode) || 'default';
  });
  const [quickAddModeOpen, setQuickAddModeOpen] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(() => {
    const saved = localStorage.getItem('show-completed-tasks');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    initDB().then(async () => {
      loadData();
      // Load completed tasks visibility setting from database
      const settings = await getSettings();
      if (settings?.showCompletedTasks !== undefined) {
        setShowCompletedTasks(settings.showCompletedTasks);
      }
      setIsLoading(false);
    });
    // التحقق من تثبيت التطبيق
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // التحقق من حالة الإشعارات
    const permission = getNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // إضافة CSS مخصص لـ SweetAlert
    const style = document.createElement('style');
    style.textContent = `
      .swal2-popup {
        z-index: 99999 !important;
      }
      .swal2-backdrop {
        z-index: 99998 !important;
      }
      .swal2-container {
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('view-mode', viewMode);
  }, [viewMode]);

  const loadData = async () => {
    const [loadedBoards, loadedTasks, settings] = await Promise.all([
      getAllBoards(),
      getAllTasks(),
      getSettings(),
    ]);
    
    if (loadedBoards.length === 0) {
      const defaultBoards: Board[] = [
        { id: 'board-1', title: 'قائمة المهام', order: 0, createdAt: new Date().toISOString() },
        { id: 'board-2', title: 'قيد التنفيذ', order: 1, createdAt: new Date().toISOString() },
        { id: 'board-3', title: 'مكتمل', order: 2, createdAt: new Date().toISOString() },
      ];
      await Promise.all(defaultBoards.map(saveBoard));
      setBoards(defaultBoards);
    } else {
      setBoards(loadedBoards.sort((a, b) => a.order - b.order));
    }
    
    setTasks(loadedTasks);
    if (settings?.theme) {
      setTheme(settings.theme);
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'board') {
      // سحب وإفلات الأقسام نفسها
      const newBoards = Array.from(boards);
      const [moved] = newBoards.splice(source.index, 1);
      newBoards.splice(destination.index, 0, moved);
      
      const updated = newBoards.map((b, i) => ({ ...b, order: i }));
      setBoards(updated);
      await Promise.all(updated.map(saveBoard));
    } else if (type === 'task') {
      // سحب وإفلات المهام
      const sourceBoardId = source.droppableId;
      const destBoardId = destination.droppableId;
      
      // التحقق من أن الوجهة صالحة
      const destBoard = boards.find(b => b.id === destBoardId);
      
      // إذا كان من كانبان، نحتاج لمعالجة الحالة
      if (destBoardId.startsWith('kanban-')) {
        const status = destBoardId.replace('kanban-', '') as Task['status'];
        // العثور على المهمة المراد نقلها
        const taskToMove = tasks.find(t => t.id === result.draggableId);
        if (!taskToMove) {
          showToast('المهمة غير موجودة', 'error');
          return;
        }
        
        // تحديث حالة المهمة فقط
        const updatedTask = { ...taskToMove, status };
        const newTasks = tasks.map(t => t.id === result.draggableId ? updatedTask : t);
        setTasks(newTasks);
        await saveTask(updatedTask);
        
        const statusLabels = {
          'waiting': 'في الانتظار',
          'working': 'قيد التنفيذ', 
          'completed': 'مكتملة'
        };
        showToast(`تم نقل المهمة إلى ${statusLabels[status]}`, 'success');
        return;
      }
      
      // إذا كان من التقويم، نحتاج لمعالجة التاريخ
      if (destBoardId.startsWith('calendar-')) {
        const dateString = destBoardId.replace('calendar-', '');
        const [year, month, day] = dateString.split('-').map(Number);
        const newDate = new Date(year, month, day).toISOString();
        
        // العثور على المهمة المراد نقلها
        const taskToMove = tasks.find(t => t.id === result.draggableId);
        if (!taskToMove) {
          showToast('المهمة غير موجودة', 'error');
          return;
        }
        
        // تحديث تاريخ المهمة
        const updatedTask = { ...taskToMove, dueDate: newDate };
        const newTasks = tasks.map(t => t.id === result.draggableId ? updatedTask : t);
        setTasks(newTasks);
        await saveTask(updatedTask);
        
        showToast(`تم نقل المهمة إلى ${day}/${month + 1}/${year}`, 'success');
        return;
      }
      
      if (!destBoard) {
        showToast('القسم الوجهة غير موجود', 'error');
        return;
      }
      
      // العثور على المهمة المراد نقلها
      const taskToMove = tasks.find(t => t.id === result.draggableId);
      if (!taskToMove) {
        showToast('المهمة غير موجودة', 'error');
        return;
      }
      
      // إذا كان نفس القسم، فقط إعادة ترتيب
      if (sourceBoardId === destBoardId) {
        const boardTasks = tasks.filter(t => t.boardId === sourceBoardId);
        const [movedTask] = boardTasks.splice(source.index, 1);
        boardTasks.splice(destination.index, 0, movedTask);
        
        // تحديث ترتيب المهام
        const updatedTasks = boardTasks.map((task, index) => ({
          ...task,
          order: index
        }));
        
        // تحديث جميع المهام
        const otherTasks = tasks.filter(t => t.boardId !== sourceBoardId);
        const allTasks = [...otherTasks, ...updatedTasks];
        
        setTasks(allTasks);
        await saveTasks(updatedTasks);
        return;
      }
      
      // إنشاء نسخة جديدة من المهام
      const newTasks = tasks.map(task => {
        if (task.id === result.draggableId) {
          return {
            ...task,
            boardId: destBoardId,
            order: destination.index
          };
        }
        return task;
      });
      
      // إعادة ترتيب المهام في القسم المصدر
      const sourceTasks = newTasks.filter(t => t.boardId === sourceBoardId);
      sourceTasks.forEach((task, index) => {
        task.order = index;
      });
      
      // إعادة ترتيب المهام في القسم الوجهة
      const destTasks = newTasks.filter(t => t.boardId === destBoardId);
      destTasks.forEach((task, index) => {
        task.order = index;
      });
      
      // تحديث المهام
      setTasks(newTasks);
      await saveTasks(newTasks);
      
      // تحديد نوع القسم الوجهة
      const isSubBoard = destBoard.parentId ? 'قسم فرعي' : 'قسم رئيسي';
      showToast(`تم نقل المهمة إلى ${destBoard.title} (${isSubBoard})`, 'success');
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!taskData.title?.trim()) {
      showToast('عنوان المهمة مطلوب', 'error');
      return;
    }
    if (!taskData.boardId) {
      showToast('يجب اختيار قسم للمهمة', 'error');
      return;
    }
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title.trim(),
      description: taskData.description,
      status: taskData.status || 'waiting',
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      dueDate: taskData.dueDate,
      boardId: taskData.boardId,
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };
    
    setTasks([...tasks, newTask]);
    await saveTask(newTask);
    await playSound('create');
    showToast('تم إضافة المهمة بنجاح', 'success');
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      const updated = tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      setTasks(updated);
      await saveTask(updated.find(t => t.id === taskData.id)!);
      showToast('تم تحديث المهمة', 'success');
      
      // التحقق من التقدم وإرسال الإشعارات
      const totalTasks = updated.length;
      const completedTasks = updated.filter(t => t.status === 'completed').length;
      await checkAndNotifyProgress(totalTasks, completedTasks);
      
      // التحقق من اكتمال جميع المهام
      if (checkAllTasksCompleted(updated)) {
        setTimeout(() => {
          showAllTasksCompletedAlert();
        }, 1000);
      }
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'مهمة جديدة',
        description: taskData.description,
        status: taskData.status || 'waiting',
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate,
        boardId: taskData.boardId || boards[0]?.id || '',
        completedAt: taskData.completedAt,
        archived: taskData.archived || false,
        archivedAt: taskData.archivedAt,
        createdAt: new Date().toISOString(),
        order: tasks.filter(t => t.boardId === (taskData.boardId || boards[0]?.id || '')).length,
      };
      setTasks([...tasks, newTask]);
      await saveTask(newTask);
      await playSound('create');
      showToast('تم إضافة المهمة', 'success');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const result = await Swal.fire({
      title: 'حذف المهمة؟',
      text: 'لا يمكن التراجع عن هذا الإجراء',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'z-[9999]'
      }
    });
    
    if (result.isConfirmed) {
      setTasks(tasks.filter(t => t.id !== id));
      await deleteTask(id);
      await playSound('delete');
      showToast('تم حذف المهمة', 'info');
    }
  };

  const handleDeleteBoard = async (id: string) => {
    const board = boards.find(b => b.id === id);
    if (!board) return;

    const isSubBoard = board.parentId ? 'قسم فرعي' : 'قسم رئيسي';
    const parentBoard = board.parentId ? boards.find(b => b.id === board.parentId) : null;
    
    // إغلاق جميع النوافذ المنبثقة الأخرى أولاً
    Swal.close();
    
    const result = await Swal.fire({
      title: `حذف ${isSubBoard}؟`,
      html: `
        <div class="text-center">
          <p class="text-lg mb-2">هل أنت متأكد من حذف "${board.title}"؟</p>
          ${parentBoard ? `<p class="text-sm text-muted-foreground">القسم الرئيسي: ${parentBoard.title}</p>` : ''}
          <p class="text-sm text-red-600 mt-2">سيتم حذف جميع المهام في هذا القسم</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'z-[999999]',
        container: 'z-[999999]'
      },
      allowOutsideClick: false,
      allowEscapeKey: true,
      focusConfirm: false,
      focusCancel: false,
      backdrop: true,
      didOpen: () => {
        // التأكد من إغلاق جميع النوافذ الأخرى
        document.querySelectorAll('.swal2-container').forEach(el => {
          if (el !== document.querySelector('.swal2-container:last-child')) {
            el.remove();
          }
        });
      }
    });
    
    if (result.isConfirmed) {
      // حذف القسم
      setBoards(boards.filter(b => b.id !== id));
      
      // حذف جميع المهام في هذا القسم
      setTasks(tasks.filter(t => t.boardId !== id));
      
      // حذف من قاعدة البيانات
      await deleteBoard(id);
      
      // حذف المهام من قاعدة البيانات
      const tasksToDelete = tasks.filter(t => t.boardId === id);
      await Promise.all(tasksToDelete.map(task => deleteTask(task.id)));
      
      showToast(`تم حذف ${isSubBoard} "${board.title}"`, 'success');
    }
  };

  const handleMoveToBoard = async (taskId: string, boardId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.boardId === boardId) return;

    const updatedTask = { ...task, boardId };
    const newTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(newTasks);
    await saveTask(updatedTask);
    showToast('تم نقل المهمة بنجاح', 'success');
  };

  const handleToggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    await saveSettings({
      soundsEnabled: true,
      notificationsEnabled: notificationsEnabled,
      theme: newTheme,
      currentSound: 'default',
    });
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        await sendTestNotification();
        showToast('تم تفعيل الإشعارات بنجاح', 'success');
        await saveSettings({
          soundsEnabled: true,
          notificationsEnabled: true,
          theme: theme,
          currentSound: 'default',
        });
      } else {
        showToast('تم رفض إذن الإشعارات', 'error');
      }
    } else {
      setNotificationsEnabled(false);
      showToast('تم إيقاف الإشعارات', 'info');
      await saveSettings({
        soundsEnabled: true,
        notificationsEnabled: false,
        theme: theme,
        currentSound: 'default',
      });
    }
  };

  const handleResetNotifications = () => {
    resetNotificationMilestones();
    showToast('تم إعادة تعيين الإشعارات', 'success');
  };

  const handleArchiveTask = async (taskId: string) => {
    await archiveTask(taskId);
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    await playSound('archive');
    showToast('تم أرشفة المهمة بنجاح', 'success');
  };

  const handleAddBoard = async (boardData: Partial<Board>) => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: boardData.title || 'قسم جديد',
      description: boardData.description,
      order: boards.length,
      createdAt: new Date().toISOString(),
      parentId: boardData.parentId,
      color: boardData.color || '#3b82f6',
      icon: boardData.icon,
      isFavorite: boardData.isFavorite || false,
      isArchived: boardData.isArchived || false,
      category: boardData.category || 'عام',
      template: boardData.template,
    };
    setBoards([...boards, newBoard]);
    await saveBoard(newBoard);
    showToast('تم إضافة القسم', 'success');
  };

  const handleAddSubBoard = async (parentId: string, title: string) => {
    const newSubBoard: Board = {
      id: `board-${Date.now()}`,
      title,
      order: boards.filter(b => b.parentId === parentId).length,
      createdAt: new Date().toISOString(),
      parentId,
      isSubBoard: true,
      color: '#8b5cf6', // لون مختلف للأقسام الفرعية
    };
    setBoards([...boards, newSubBoard]);
    await saveBoard(newSubBoard);
    showToast(`تم إضافة القسم الفرعي "${title}"`, 'success');
  };

  const handleToggleBoardCollapse = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const updated = { ...board, collapsed: !board.collapsed };
      setBoards(boards.map(b => b.id === boardId ? updated : b));
      await saveBoard(updated);
    }
  };

  const handleDuplicateBoard = async (board: Board) => {
    const duplicatedBoard: Board = {
      ...board,
      id: `board-${Date.now()}`,
      title: `${board.title} (نسخة)`,
      createdAt: new Date().toISOString(),
      order: boards.length,
    };
    setBoards([...boards, duplicatedBoard]);
    await saveBoard(duplicatedBoard);
    showToast('تم تكرار القسم', 'success');
  };

  const handleArchiveBoard = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const updated = { ...board, isArchived: true };
      setBoards(boards.map(b => b.id === boardId ? updated : b));
      await saveBoard(updated);
      showToast('تم أرشفة القسم', 'success');
    }
  };

  const handleToggleFavorite = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const updated = { ...board, isFavorite: !board.isFavorite };
      setBoards(boards.map(b => b.id === boardId ? updated : b));
      await saveBoard(updated);
      showToast(updated.isFavorite ? 'تم إضافة للمفضلة' : 'تم إزالة من المفضلة', 'success');
    }
  };

  const handleToggleSubBoardVisibility = (boardId: string) => {
    setHiddenSubBoards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boardId)) {
        newSet.delete(boardId);
        showToast('تم إظهار الأقسام الفرعية', 'success');
      } else {
        newSet.add(boardId);
        showToast('تم إخفاء الأقسام الفرعية', 'info');
      }
      return newSet;
    });
  };

  const handleToggleCompletedTasks = async () => {
    const newValue = !showCompletedTasks;
    setShowCompletedTasks(newValue);
    localStorage.setItem('show-completed-tasks', JSON.stringify(newValue));
    
    // Save to database settings
    const settings = await getSettings();
    if (settings) {
      await saveSettings({
        ...settings,
        showCompletedTasks: newValue,
      });
    }
  };

  const handleFocusOnBoard = (boardId: string) => {
    if (focusedBoardId === boardId) {
      setFocusedBoardId(null);
      showToast('تم إلغاء التركيز', 'info');
    } else {
      setFocusedBoardId(boardId);
      const board = boards.find(b => b.id === boardId);
      showToast(`تم التركيز على "${board?.title}"`, 'success');
    }
  };

  const handleDeleteAllData = async () => {
    const result = await Swal.fire({
      title: 'حذف جميع البيانات؟',
      html: `
        <div class="text-center">
          <div class="text-6xl mb-4">⚠️</div>
          <h3 class="text-2xl font-bold text-red-600 mb-4">تحذير شديد!</h3>
          <p class="text-gray-600 mb-6">أنت على وشك حذف جميع البيانات نهائياً:</p>
          <div class="text-right space-y-2 text-sm text-gray-500">
            <div>• جميع المهام (${tasks.length} مهمة)</div>
            <div>• جميع الأقسام (${boards.length} قسم)</div>
            <div>• جميع الإعدادات</div>
            <div>• جميع الجلسات</div>
          </div>
          <p class="text-red-600 font-bold mt-4">لا يمكن التراجع عن هذا الإجراء!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف الكل',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: `
        rgba(0,0,0,0.4)
        left top
        no-repeat
      `,
      customClass: {
        popup: 'animate-pulse',
        title: 'font-cairo',
        htmlContainer: 'font-tajawal',
        confirmButton: 'font-cairo',
        cancelButton: 'font-cairo'
      },
      input: 'text',
      inputPlaceholder: 'اكتب "حذف" للتأكيد',
      inputValidator: (value) => {
        if (value !== 'حذف') {
          return 'يجب كتابة "حذف" للتأكيد';
        }
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteAllData();
        
        // إعادة تعيين جميع الحالات
        setBoards([]);
        setTasks([]);
        setFocusedBoardId(null);
        setHiddenSubBoards(new Set());
        setSearchQuery('');
        setFilters({
          status: [],
          priority: [],
          tags: [],
          boardId: null,
          boardCategory: null,
          showFavoritesOnly: false,
          overdue: false,
        });
        
        // إعادة تحميل البيانات الافتراضية
        await loadData();
        
        await playSound('delete');
        showToast('تم حذف جميع البيانات بنجاح', 'success');
        
        // رسالة تأكيد
        await Swal.fire({
          title: 'تم الحذف بنجاح!',
          text: 'تم حذف جميع البيانات وإعادة تعيين التطبيق',
          icon: 'success',
          confirmButtonText: 'حسناً',
          customClass: {
            popup: 'z-[9999]'
          }
        });
      } catch (error) {
        console.error('خطأ في حذف البيانات:', error);
        showToast('حدث خطأ أثناء حذف البيانات', 'error');
      }
    }
  };

  // التحقق من اكتمال جميع المهام
  const checkAllTasksCompleted = (updatedTasks: Task[]) => {
    const activeTasks = updatedTasks.filter(t => !t.archived);
    if (activeTasks.length === 0) return false;
    
    const allCompleted = activeTasks.every(t => t.status === 'completed');
    return allCompleted;
  };

  // إظهار رسالة اكتمال جميع المهام
  const showAllTasksCompletedAlert = async () => {
    const result = await Swal.fire({
      title: '🎉 مبروك!',
      html: `
        <div class="text-center">
          <div class="text-6xl mb-4">🏆</div>
          <h3 class="text-2xl font-bold text-green-600 mb-4">لقد أكملت جميع المهام!</h3>
          <p class="text-gray-600 mb-6">أحسنت! لقد أنجزت جميع مهامك بنجاح. هذا إنجاز رائع يستحق الاحتفال!</p>
          <div class="flex justify-center space-x-4 text-sm text-gray-500">
            <span>✨ إنتاجية عالية</span>
            <span>💪 مثابرة</span>
            <span>🎯 تركيز</span>
          </div>
        </div>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'إضافة مهام جديدة',
      cancelButtonText: 'الاحتفال فقط! 🎊',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: `
        rgba(0,0,0,0.4)
        left top
        no-repeat
      `,
      customClass: {
        popup: 'animate-bounce',
        title: 'font-cairo',
        htmlContainer: 'font-tajawal',
        confirmButton: 'font-cairo',
        cancelButton: 'font-cairo'
      }
    });

    if (result.isConfirmed) {
      // إضافة مهمة جديدة
      setTaskModalOpen(true);
    }
  };

  const handleCopyAllTasks = async () => {
    const tasksToUse = searchQuery || filters.status.length > 0 || filters.priority.length > 0 || filters.tags.length > 0 || filters.boardId || filters.overdue
      ? filteredTasks
      : tasks;

    if (tasksToUse.length === 0) {
      showToast('لا توجد مهام لنسخها', 'info');
      return;
    }

    const isFiltered = tasksToUse !== tasks;
    let success = false;

    if (isFiltered) {
      let filterDesc = 'الفلاتر المطبقة: ';
      const filters_list = [];
      if (searchQuery) filters_list.push(`البحث: "${searchQuery}"`);
      if (filters.status.length > 0) filters_list.push(`الحالة: ${filters.status.join(', ')}`);
      if (filters.priority.length > 0) filters_list.push(`الأولوية: ${filters.priority.join(', ')}`);
      if (filters.tags.length > 0) filters_list.push(`الوسوم: ${filters.tags.join(', ')}`);
      if (filters.boardId) {
        const board = boards.find(b => b.id === filters.boardId);
        if (board) filters_list.push(`القسم: ${board.title}`);
      }
      if (filters.overdue) filters_list.push('المهام المتأخرة');
      filterDesc += filters_list.join(' | ');
      
      success = await copyFilteredTasks(tasksToUse, filterDesc);
    } else {
      success = await copyAllTasks(boards, tasks);
    }

    if (success) {
      showToast(`تم نسخ ${tasksToUse.length} مهمة إلى الحافظة`, 'success');
    } else {
      showToast('فشل نسخ المهام', 'error');
    }
  };

  const allTags = [...new Set(tasks.flatMap(t => t.tags))];
  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.status.length && !filters.status.includes(t.status)) return false;
    if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
    if (filters.tags.length && !filters.tags.some(tag => t.tags.includes(tag))) return false;
    if (filters.boardId && t.boardId !== filters.boardId) return false;
    if (filters.overdue && (!t.dueDate || new Date(t.dueDate) >= new Date() || t.status === 'completed')) return false;
    
    // Board category filter
    if (filters.boardCategory) {
      const taskBoard = boards.find(b => b.id === t.boardId);
      if (!taskBoard || taskBoard.category !== filters.boardCategory) return false;
    }
    
    // Favorites filter
    if (filters.showFavoritesOnly) {
      const taskBoard = boards.find(b => b.id === t.boardId);
      if (!taskBoard || !taskBoard.isFavorite) return false;
    }
    
    // Completed tasks filter
    if (!showCompletedTasks && t.status === 'completed') return false;
    
    return true;
  });

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-cairo text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              مهام اليوم
            </h1>
            <div className="flex gap-2 items-center">
              {!isStandalone && (
                <Link to="/install">
                  <Button variant="outline" size="icon" title="تثبيت التطبيق">
                    <Smartphone className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button 
                onClick={handleToggleNotifications} 
                variant={notificationsEnabled ? "default" : "outline"} 
                size="icon"
                title={notificationsEnabled ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'}
              >
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </Button>
              <Button onClick={() => setArchiveModalOpen(true)} variant="outline" size="icon" title="الأرشيف">
                <Archive className="h-5 w-5" />
              </Button>
              <FocusTimerBadge onClick={() => setTimerModalOpen(true)} />
              <Button onClick={() => setTimerModalOpen(true)} variant="outline" size="icon">
                <Timer className="h-5 w-5" />
              </Button>
              <Button onClick={() => setStatusModalOpen(true)} variant="outline" size="icon" title="إدارة الحالات">
                <Settings2 className="h-5 w-5" />
              </Button>
              <Button onClick={() => setBoardManagerOpen(true)} variant="outline" size="icon" title="إدارة الأقسام">
                <FolderTree className="h-5 w-5" />
              </Button>
              <Button onClick={() => setQuickAddModeOpen(true)} variant="outline" size="icon" title="وضع الإضافة السريعة">
                <Zap className="h-5 w-5" />
              </Button>
              <Button onClick={handleCopyAllTasks} variant="outline" size="icon" title="نسخ جميع المهام">
                <Copy className="h-5 w-5" />
              </Button>
              <Button onClick={handleDeleteAllData} variant="outline" size="icon" title="حذف جميع البيانات" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button onClick={() => setExportModalOpen(true)} variant="outline" size="icon" title="تصدير المهام">
                <Download className="h-5 w-5" />
              </Button>
              <Button onClick={handleToggleTheme} variant="outline" size="icon" title={theme === 'light' ? 'الوضع المظلم' : 'الوضع المضيء'}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} boards={boards} allTags={allTags} />
            <Button onClick={() => setBulkModalOpen(true)} variant="secondary">
              <Layers className="h-4 w-4 ml-2" />
              مهام متعددة
            </Button>
            <Button onClick={() => setImportModalOpen(true)} variant="secondary">
              <Upload className="h-4 w-4 ml-2" />
              استيراد
            </Button>
            <Button onClick={async () => { 
              const { value } = await Swal.fire({ 
                title: 'قسم جديد', 
                input: 'text', 
                inputPlaceholder: 'اسم القسم', 
                showCancelButton: true,
                customClass: {
                  popup: 'z-[9999]'
                }
              }); 
              if (value) { 
                const newBoard: Board = { 
                  id: `board-${Date.now()}`, 
                  title: value, 
                  order: boards.length, 
                  createdAt: new Date().toISOString() 
                }; 
                setBoards([...boards, newBoard]); 
                await saveBoard(newBoard); 
              } 
            }}>
              <Plus className="h-4 w-4 ml-2" />
              قسم جديد
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* الإحصائيات */}
        <Statistics tasks={tasks} />

        {/* اختيار طريقة العرض */}
        <div className="mb-6">
          <ViewModeSelector 
            currentMode={viewMode} 
            onModeChange={setViewMode} 
          />
        </div>

        {/* تبديل إظهار المهام المكتملة */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Button
              variant={showCompletedTasks ? "default" : "outline"}
              onClick={handleToggleCompletedTasks}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {showCompletedTasks ? 'إظهار المهام المكتملة' : 'إخفاء المهام المكتملة'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {showCompletedTasks ? 'المهام المكتملة ظاهرة' : 'المهام المكتملة مخفية'}
            </span>
          </div>
        </div>

        {/* عرض الأقسام حسب طريقة العرض المختارة */}
        {viewMode === 'default' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="boards" type="board" direction="vertical">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
                  {boards.filter(board => !board.parentId && !board.isArchived).map((board, index) => {
                    const isFocused = focusedBoardId === board.id;
                    const isHidden = focusedBoardId && focusedBoardId !== board.id;
                    
                    if (isHidden) return null;
                    
                    return (
                      <BoardColumn 
                        key={board.id} 
                        board={board} 
                        boards={boards} 
                        tasks={filteredTasks.sort((a, b) => a.order - b.order)} 
                        index={index} 
                        isFocused={isFocused}
                        onToggleFocus={(id) => setFocusedBoardId(focusedBoardId === id ? null : id)}
                        onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }} 
                        onEditBoard={async (b) => { 
                          const { value } = await Swal.fire({ 
                            title: 'تعديل القسم', 
                            input: 'text', 
                            inputValue: b.title, 
                            showCancelButton: true,
                            customClass: {
                              popup: 'z-[9999]'
                            }
                          }); 
                          if (value) { 
                            const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                            setBoards(updated); 
                            await saveBoard({ ...b, title: value }); 
                          } 
                        }} 
                        onDeleteBoard={handleDeleteBoard} 
                        onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }} 
                        onDeleteTask={handleDeleteTask} 
                        onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }} 
                        onTaskStatusChange={async (id, status) => { 
                          const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                          setTasks(updated); 
                          await saveTask(updated.find(t => t.id === id)!); 
                          if (status === 'completed') await playSound('complete');
                          
                          // التحقق من التقدم وإرسال الإشعارات
                          const totalTasks = updated.length;
                          const completedTasks = updated.filter(t => t.status === 'completed').length;
                          await checkAndNotifyProgress(totalTasks, completedTasks);
                          
                          // التحقق من اكتمال جميع المهام
                          if (status === 'completed' && checkAllTasksCompleted(updated)) {
                            setTimeout(() => {
                              showAllTasksCompletedAlert();
                            }, 1000); // تأخير قصير لإظهار الإشعار بعد تحديث المهمة
                          }
                        }}
                        onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }} 
                        onMoveToBoard={handleMoveToBoard}
                        onArchiveTask={handleArchiveTask}
                        onAddSubBoard={handleAddSubBoard}
                        onToggleBoardCollapse={handleToggleBoardCollapse}
                        onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                        onFocusOnBoard={handleFocusOnBoard}
                        hiddenSubBoards={hiddenSubBoards}
                        focusedBoardId={focusedBoardId}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {viewMode === 'grid' && (
                <GridView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
            )}
            
            {viewMode === 'list' && (
              <ListView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
            )}
            
            {viewMode === 'calendar' && (
              <CalendarView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
            )}
            
            {viewMode === 'kanban' && (
              <KanbanView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
            )}
            
            {viewMode === 'table' && (
              <TableView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
            )}
            
            {viewMode === 'chart' && (
              <ChartView
                boards={boards}
                tasks={filteredTasks}
                onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }}
                onEditBoard={async (b) => { 
                  const { value } = await Swal.fire({ 
                    title: 'تعديل القسم', 
                    input: 'text', 
                    inputValue: b.title, 
                    showCancelButton: true,
                    customClass: { popup: 'z-[9999]' }
                  }); 
                  if (value) { 
                    const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); 
                    setBoards(updated); 
                    await saveBoard({ ...b, title: value }); 
                  } 
                }}
                onDeleteBoard={handleDeleteBoard}
                onEditTask={(t) => { setEditingTask(t); setTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={async (t) => { const dup: Task = { ...t, id: `task-${Date.now()}`, title: `${t.title} (نسخة)`, createdAt: new Date().toISOString() }; setTasks([...tasks, dup]); await saveTask(dup); showToast('تم تكرار المهمة', 'success'); }}
                onTaskStatusChange={async (id, status) => { 
                  const updated = tasks.map(t => t.id === id ? { ...t, status, ...(status === 'completed' && { completedAt: new Date().toISOString() }) } : t); 
                  setTasks(updated); 
                  await saveTask(updated.find(t => t.id === id)!); 
                  if (status === 'completed') await playSound('complete');
                }}
                onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }}
                onMoveToBoard={handleMoveToBoard}
                onArchiveTask={handleArchiveTask}
                onAddSubBoard={handleAddSubBoard}
                onToggleBoardCollapse={handleToggleBoardCollapse}
                onToggleSubBoardVisibility={handleToggleSubBoardVisibility}
                onFocusOnBoard={handleFocusOnBoard}
                hiddenSubBoards={hiddenSubBoards}
                focusedBoardId={focusedBoardId}
                showCompletedTasks={showCompletedTasks}
              />
              )}
            </div>
          </DragDropContext>
        )}
      </main>

      <TaskEditModal open={taskModalOpen} onOpenChange={setTaskModalOpen} task={editingTask} boards={boards} defaultBoardId={defaultBoardId} onSave={handleSaveTask} />
      <BulkAddModal open={bulkModalOpen} onOpenChange={setBulkModalOpen} boards={boards} defaultBoardId={defaultBoardId} onTasksAdded={loadData} />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} boards={boards} onTasksAdded={loadData} onBoardsAdded={loadData} />
      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} boards={boards} tasks={filteredTasks} isFiltered={searchQuery !== '' || filters.status.length > 0} />
      <ArchiveModal open={archiveModalOpen} onOpenChange={setArchiveModalOpen} boards={boards} onTaskRestored={loadData} onTaskDeleted={loadData} />
      <FocusTimer open={timerModalOpen} onOpenChange={setTimerModalOpen} />
      <StatusManagement open={statusModalOpen} onOpenChange={setStatusModalOpen} onStatusesChange={() => loadData()} />
      <BoardManager 
        open={boardManagerOpen} 
        onOpenChange={setBoardManagerOpen} 
        boards={boards} 
        onAddBoard={handleAddBoard}
        onEditBoard={async (b) => { 
          const updated = boards.map(board => board.id === b.id ? b : board); 
          setBoards(updated); 
          await saveBoard(b); 
        }}
        onDeleteBoard={handleDeleteBoard}
        onToggleCollapse={handleToggleBoardCollapse}
        onDuplicateBoard={handleDuplicateBoard}
        onArchiveBoard={handleArchiveBoard}
        onToggleFavorite={handleToggleFavorite}
      />
      <QuickAddMode
        isOpen={quickAddModeOpen}
        onClose={() => setQuickAddModeOpen(false)}
        boards={boards}
        onAddBoard={handleAddBoard}
        onAddTask={handleAddTask}
        onAddSubBoard={handleAddSubBoard}
      />
    </div>
  );
}
