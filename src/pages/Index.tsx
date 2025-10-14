// الصفحة الرئيسية - تطبيق مهام اليوم
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Timer, Download, Moon, Sun, Layers, Settings2, Smartphone, Copy, Bell, BellOff, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoardColumn } from '@/components/BoardColumn';
import { TaskEditModal } from '@/components/TaskEditModal';
import { BulkAddModal } from '@/components/BulkAddModal';
import { ExportModal } from '@/components/ExportModal';
import { ArchiveModal } from '@/components/ArchiveModal';
import { FocusTimer, FocusTimerBadge } from '@/components/FocusTimer';
import { SearchBar, FilterState } from '@/components/SearchBar';
import { Statistics } from '@/components/Statistics';
import { StatusManagement } from '@/components/StatusManagement';
import { SplashScreen } from '@/components/SplashScreen';
import { initDB, getAllBoards, getAllTasks, saveBoard, saveTask, saveTasks, deleteBoard, deleteTask, archiveTask, getSettings, saveSettings } from '@/lib/db';
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
    overdue: false,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultBoardId, setDefaultBoardId] = useState<string>();
  const [focusedBoardId, setFocusedBoardId] = useState<string | null>(null);

  useEffect(() => {
    initDB().then(() => {
      loadData();
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
  }, [theme]);

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
      const newBoards = Array.from(boards);
      const [moved] = newBoards.splice(source.index, 1);
      newBoards.splice(destination.index, 0, moved);
      
      const updated = newBoards.map((b, i) => ({ ...b, order: i }));
      setBoards(updated);
      await Promise.all(updated.map(saveBoard));
    } else {
      const sourceBoardId = source.droppableId;
      const destBoardId = destination.droppableId;
      
      const newTasks = Array.from(tasks);
      const taskIndex = newTasks.findIndex(t => t.id === result.draggableId);
      const [movedTask] = newTasks.splice(taskIndex, 1);
      
      movedTask.boardId = destBoardId;
      
      const destTasks = newTasks.filter(t => t.boardId === destBoardId);
      destTasks.splice(destination.index, 0, movedTask);
      destTasks.forEach((t, i) => t.order = i);
      
      setTasks([...newTasks.filter(t => t.boardId !== destBoardId), ...destTasks]);
      await saveTasks(destTasks);
    }
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
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData as any,
        createdAt: new Date().toISOString(),
        order: tasks.filter(t => t.boardId === taskData.boardId).length,
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
    });
    
    if (result.isConfirmed) {
      setTasks(tasks.filter(t => t.id !== id));
      await deleteTask(id);
      await playSound('delete');
      showToast('تم حذف المهمة', 'info');
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
    showToast('تم أرشفة المهمة بنجاح', 'success');
  };

  const handleAddSubBoard = async (parentId: string, title: string) => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title,
      order: boards.length,
      createdAt: new Date().toISOString(),
      parentId,
    };
    setBoards([...boards, newBoard]);
    await saveBoard(newBoard);
    showToast('تم إضافة القسم الفرعي', 'success');
  };

  const handleToggleBoardCollapse = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      const updated = { ...board, collapsed: !board.collapsed };
      setBoards(boards.map(b => b.id === boardId ? updated : b));
      await saveBoard(updated);
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
              <Button onClick={handleCopyAllTasks} variant="outline" size="icon" title="نسخ جميع المهام">
                <Copy className="h-5 w-5" />
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
            <Button onClick={async () => { const { value } = await Swal.fire({ title: 'قسم جديد', input: 'text', inputPlaceholder: 'اسم القسم', showCancelButton: true }); if (value) { const newBoard: Board = { id: `board-${Date.now()}`, title: value, order: boards.length, createdAt: new Date().toISOString() }; setBoards([...boards, newBoard]); await saveBoard(newBoard); } }}>
              <Plus className="h-4 w-4 ml-2" />
              قسم جديد
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* الإحصائيات */}
        <Statistics tasks={tasks} />

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="boards" type="board" direction="vertical">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
                {boards.map((board, index) => {
                  const isFocused = focusedBoardId === board.id;
                  const isHidden = focusedBoardId && focusedBoardId !== board.id;
                  
                  if (isHidden) return null;
                  
                  return (
                    <BoardColumn 
                      key={board.id} 
                      board={board} 
                      boards={boards} 
                      tasks={filteredTasks.filter(t => t.boardId === board.id).sort((a, b) => a.order - b.order)} 
                      index={index} 
                      isFocused={isFocused}
                      onToggleFocus={(id) => setFocusedBoardId(focusedBoardId === id ? null : id)}
                      onAddTask={(id) => { setDefaultBoardId(id); setEditingTask(undefined); setTaskModalOpen(true); }} 
                      onEditBoard={async (b) => { const { value } = await Swal.fire({ title: 'تعديل القسم', input: 'text', inputValue: b.title, showCancelButton: true }); if (value) { const updated = boards.map(board => board.id === b.id ? { ...board, title: value } : board); setBoards(updated); await saveBoard({ ...b, title: value }); } }} 
                      onDeleteBoard={async (id) => { const result = await Swal.fire({ title: 'حذف القسم؟', text: 'سيتم حذف جميع المهام فيه', icon: 'warning', showCancelButton: true, confirmButtonText: 'حذف', confirmButtonColor: '#ef4444' }); if (result.isConfirmed) { setBoards(boards.filter(b => b.id !== id)); setTasks(tasks.filter(t => t.boardId !== id)); await deleteBoard(id); } }} 
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
                      }}
                      onBulkAdd={(id) => { setDefaultBoardId(id); setBulkModalOpen(true); }} 
                      onMoveToBoard={handleMoveToBoard}
                      onArchiveTask={handleArchiveTask}
                      onAddSubBoard={handleAddSubBoard}
                      onToggleBoardCollapse={handleToggleBoardCollapse}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>

      <TaskEditModal open={taskModalOpen} onOpenChange={setTaskModalOpen} task={editingTask} boards={boards} defaultBoardId={defaultBoardId} onSave={handleSaveTask} />
      <BulkAddModal open={bulkModalOpen} onOpenChange={setBulkModalOpen} boards={boards} defaultBoardId={defaultBoardId} onTasksAdded={loadData} />
      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} boards={boards} tasks={filteredTasks} isFiltered={searchQuery !== '' || filters.status.length > 0} />
      <ArchiveModal open={archiveModalOpen} onOpenChange={setArchiveModalOpen} boards={boards} onTaskRestored={loadData} onTaskDeleted={loadData} />
      <FocusTimer open={timerModalOpen} onOpenChange={setTimerModalOpen} />
      <StatusManagement open={statusModalOpen} onOpenChange={setStatusModalOpen} onStatusesChange={() => loadData()} />
    </div>
  );
}
