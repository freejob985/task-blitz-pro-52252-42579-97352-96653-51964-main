// مكون إدارة المهام للهواتف المحمولة
import { useState, useCallback, useRef } from 'react';
import { Plus, Layers, FolderPlus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, XCircle, Star, Archive, Eye, EyeOff, MoreVertical, ArrowLeft, ArrowRight, GripVertical, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { showToast } from '@/lib/toast';
import { useDeviceType } from '@/hooks/use-mobile';
import { archiveTask } from '@/lib/db';
import type { Board, Task, TaskStatus, TaskPriority, TaskDifficulty } from '@/types';

interface MobileTaskManagerProps {
  boards: Board[];
  tasks: Task[];
  onAddTask: (boardId: string) => void;
  onAddBoard: (title: string, description?: string, parentId?: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubBoardVisibility: (boardId: string) => void;
  hiddenSubBoards: Set<string>;
  onBulkAdd: (boardId: string) => void;
  onMoveTask: (taskId: string, boardId: string) => void;
  onArchiveTask?: (id: string) => void;
}

export function MobileTaskManager({
  boards,
  tasks,
  onAddTask,
  onAddBoard,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  onToggleSubBoardVisibility,
  hiddenSubBoards,
  onBulkAdd,
  onMoveTask,
  onArchiveTask,
}: MobileTaskManagerProps) {
  const { isMobile, isTablet, isTouch } = useDeviceType();
  const [activeTab, setActiveTab] = useState('tasks');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newSubBoardOpen, setNewSubBoardOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('medium');
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newSubBoardTitle, setNewSubBoardTitle] = useState('');
  const [newSubBoardDescription, setNewSubBoardDescription] = useState('');
  const [parentBoardId, setParentBoardId] = useState<string>('');
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // الأقسام الرئيسية فقط
  const mainBoards = boards.filter(board => !board.parentId && !board.isArchived);
  
  // الأقسام الفرعية
  const subBoards = boards.filter(board => board.parentId && !board.isArchived);

  const handleAddTask = () => {
    if (!selectedBoardId || !newTaskTitle.trim()) {
      showToast('يرجى اختيار قسم وإدخال عنوان المهمة', 'error');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: 'waiting',
      priority: newTaskPriority,
      difficulty: newTaskDifficulty,
      tags: [],
      boardId: selectedBoardId,
      createdAt: new Date().toISOString(),
      order: tasks.filter(t => t.boardId === selectedBoardId).length,
    };

    onEditTask(newTask);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedBoardId('');
    setNewTaskOpen(false);
    showToast('تم إضافة المهمة بنجاح', 'success');
  };

  const handleAddBoard = () => {
    if (!newBoardTitle.trim()) {
      showToast('يرجى إدخال عنوان القسم', 'error');
      return;
    }

    onAddBoard(newBoardTitle.trim(), newBoardDescription.trim() || undefined);
    setNewBoardTitle('');
    setNewBoardDescription('');
    setNewBoardOpen(false);
    showToast('تم إضافة القسم بنجاح', 'success');
  };

  const handleAddSubBoard = () => {
    if (!newSubBoardTitle.trim() || !parentBoardId) {
      showToast('يرجى إدخال عنوان القسم الفرعي واختيار القسم الرئيسي', 'error');
      return;
    }

    onAddBoard(newSubBoardTitle.trim(), newSubBoardDescription.trim() || undefined, parentBoardId);
    setNewSubBoardTitle('');
    setNewSubBoardDescription('');
    setParentBoardId('');
    setNewSubBoardOpen(false);
    showToast('تم إضافة القسم الفرعي بنجاح', 'success');
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'working': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'waiting': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'frozen': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Touch gesture handling for swipe
  const handleSwipeStart = useCallback((e: React.TouchEvent, taskId: string) => {
    if (!isTouch) return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentTouch = e.touches[0];
      const deltaX = currentTouch.clientX - startX;
      const deltaY = currentTouch.clientY - startY;
      
      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        setSwipedTaskId(taskId);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      setTimeout(() => setSwipedTaskId(null), 2000);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [isTouch]);

  // Quick status change for mobile
  const handleQuickStatusChange = useCallback((taskId: string, currentStatus: TaskStatus) => {
    const statusOrder: TaskStatus[] = ['waiting', 'working', 'completed', 'frozen'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    
    onTaskStatusChange(taskId, nextStatus);
    showToast(`تم تغيير الحالة إلى ${getStatusLabel(nextStatus)}`, 'success');
  }, [onTaskStatusChange]);

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'waiting': return 'في الانتظار';
      case 'working': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'frozen': return 'مجمدة';
      default: return 'غير محدد';
    }
  };

  // Archive task handler
  const handleArchiveTask = useCallback(async (taskId: string) => {
    try {
      if (onArchiveTask) {
        onArchiveTask(taskId);
      } else {
        await archiveTask(taskId);
      }
      showToast('تم أرشفة المهمة بنجاح', 'success');
    } catch (error) {
      console.error('Error archiving task:', error);
      showToast('حدث خطأ أثناء أرشفة المهمة', 'error');
    }
  }, [onArchiveTask]);

  // Toggle task completion
  const handleToggleCompletion = useCallback((taskId: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === 'completed' ? 'waiting' : 'completed';
    onTaskStatusChange(taskId, newStatus);
    showToast(newStatus === 'completed' ? 'تم تحديد المهمة كمكتملة' : 'تم إلغاء تحديد المهمة كمكتملة', 'success');
  }, [onTaskStatusChange]);

  // Drag and Drop handlers for mobile
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverBoardId(null);
    
    // Remove visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, boardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBoardId(boardId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the board area completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverBoardId(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (!taskId || !draggedTaskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.boardId === targetBoardId) {
      setDragOverBoardId(null);
      return;
    }
    
    // Move task to new board using the parent's move function
    onMoveTask(taskId, targetBoardId);
    
    // Show success message
    const targetBoard = boards.find(b => b.id === targetBoardId);
    showToast(`تم نقل المهمة إلى ${targetBoard?.title || 'القسم الجديد'}`, 'success');
    
    setDragOverBoardId(null);
  }, [draggedTaskId, tasks, boards, onMoveTask]);

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, taskId: string) => {
    if (!isTouch) return;
    setDraggedTaskId(taskId);
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentTouch = e.touches[0];
      const deltaX = currentTouch.clientX - startX;
      const deltaY = currentTouch.clientY - startY;
      
      // Check if it's a drag gesture
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        // Add visual feedback for dragging
        const element = e.target as HTMLElement;
        if (element) {
          element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          element.style.opacity = '0.7';
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if dropped on a board
      const boardElement = element?.closest('[data-board-id]');
      if (boardElement) {
        const boardId = boardElement.getAttribute('data-board-id');
        if (boardId && boardId !== tasks.find(t => t.id === taskId)?.boardId) {
          onMoveTask(taskId, boardId);
          const targetBoard = boards.find(b => b.id === boardId);
          showToast(`تم نقل المهمة إلى ${targetBoard?.title || 'القسم الجديد'}`, 'success');
        }
      }
      
      // Reset visual feedback
      const draggedElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (draggedElement) {
        (draggedElement as HTMLElement).style.transform = '';
        (draggedElement as HTMLElement).style.opacity = '1';
      }
      
      setDraggedTaskId(null);
      setDragOverBoardId(null);
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [isTouch, tasks, boards, onMoveTask]);

  return (
    <div className={`${isMobile ? 'p-3' : 'p-4'} space-y-4 bg-gradient-to-br from-background to-muted/20 min-h-screen`}>
      {/* العنوان الرئيسي */}
      <div className="text-center mb-6">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cairo font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
          إدارة المهام
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isMobile ? 'إدارة مهامك بسهولة على الهاتف' : 'إدارة مهامك بسهولة'}
        </p>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="all-tasks">جميع المهام</TabsTrigger>
          <TabsTrigger value="boards">الأقسام</TabsTrigger>
          <TabsTrigger value="add">إضافة</TabsTrigger>
        </TabsList>

        {/* تبويب المهام */}
        <TabsContent value="tasks" className="space-y-4">
          {mainBoards.map(board => {
            const boardTasks = tasks.filter(t => t.boardId === board.id);
            const subBoardsForBoard = subBoards.filter(sub => sub.parentId === board.id);
            const isSubBoardsHidden = hiddenSubBoards.has(board.id);

            return (
              <Card key={board.id} className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {board.color && (
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: board.color }}
                        />
                      )}
                      <CardTitle className="text-lg font-cairo">{board.title}</CardTitle>
                      {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {boardTasks.length} مهمة
                    </Badge>
                  </div>
                  {board.description && (
                    <p className="text-sm text-muted-foreground">{board.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* الأقسام الفرعية */}
                  {subBoardsForBoard.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-accent">الأقسام الفرعية</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleSubBoardVisibility(board.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isSubBoardsHidden ? 
                            <><EyeOff className="h-3 w-3 ml-1" /> إظهار</> : 
                            <><Eye className="h-3 w-3 ml-1" /> إخفاء</>
                          }
                        </Button>
                      </div>
                      
                      {!isSubBoardsHidden && (
                        <div className="space-y-2">
                          {subBoardsForBoard.map(subBoard => {
                            const subBoardTasks = tasks.filter(t => t.boardId === subBoard.id);
                            return (
                              <div key={subBoard.id} className="p-2 bg-accent/5 rounded-lg border border-accent/20">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium">{subBoard.title}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {subBoardTasks.length} مهمة
                                  </Badge>
                                </div>
                                {subBoard.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{subBoard.description}</p>
                                )}
                                <div className="space-y-1">
                                  {subBoardTasks.slice(0, 3).map(task => (
                                    <div 
                                      key={task.id} 
                                      data-task-id={task.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, task.id)}
                                      onDragEnd={handleDragEnd}
                                      onTouchStart={(e) => handleTouchStart(e, task.id)}
                                      className={`flex items-center gap-2 p-2 bg-background rounded border transition-all duration-200 ${
                                        draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                                      } ${isTouch ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                      <Checkbox
                                        checked={task.status === 'completed'}
                                        onCheckedChange={() => handleToggleCompletion(task.id, task.status)}
                                        className="h-3 w-3 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                      />
                                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                                      {getStatusIcon(task.status)}
                                      <span className={`text-xs flex-1 truncate ${
                                        task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                                      }`}>
                                        {task.title}
                                      </span>
                                      <div className="flex gap-1">
                                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                          {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                        </Badge>
                                        <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                                          {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : task.difficulty === 'hard' ? 'صعب' : 'خبير'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  {subBoardTasks.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      +{subBoardTasks.length - 3} مهمة أخرى
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* مهام القسم الرئيسي */}
                  <div className="space-y-1">
                    {boardTasks.slice(0, isMobile ? 3 : 5).map(task => (
                      <div 
                        key={task.id} 
                        data-task-id={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => {
                          handleTouchStart(e, task.id);
                          handleSwipeStart(e, task.id);
                        }}
                        className={`relative flex items-center gap-2 p-3 bg-muted/30 rounded-lg border transition-all duration-200 ${
                          swipedTaskId === task.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                        } ${isTouch ? 'cursor-grab active:cursor-grabbing' : ''} ${
                          draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                        }`}
                        onClick={() => isTouch && handleQuickStatusChange(task.id, task.status)}
                      >
                        {/* Checkbox for completion */}
                        <div className="flex-shrink-0">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleCompletion(task.id, task.status)}
                            className="h-3 w-3 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </div>
                        
                        {/* Drag handle */}
                        <div className="flex-shrink-0 text-muted-foreground">
                          <GripVertical className="h-3 w-3" />
                        </div>
                        
                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(task.status)}
                        </div>
                        
                        {/* Task title */}
                        <span className={`text-sm flex-1 truncate font-medium ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </span>
                        
                        {/* Priority and difficulty badges */}
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : task.difficulty === 'hard' ? 'صعب' : 'خبير'}
                          </Badge>
                        </div>
                        
                        {/* Actions menu */}
                        {isTouch && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleCompletion(task.id, task.status)}>
                                <CheckCircle className="h-4 w-4 ml-2" />
                                {task.status === 'completed' ? 'إلغاء التحديد' : 'تحديد كمكتمل'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <Edit2 className="h-4 w-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchiveTask(task.id)}>
                                <Archive className="h-4 w-4 ml-2" />
                                أرشفة
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onDeleteTask(task.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        {/* Swipe indicator */}
                        {swipedTaskId === task.id && (
                          <div className="absolute inset-0 bg-primary/5 border-2 border-primary/30 rounded-lg flex items-center justify-center">
                            <div className="flex items-center gap-2 text-primary">
                              <ArrowLeft className="h-4 w-4" />
                              <span className="text-sm font-medium">اضغط لتغيير الحالة</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {boardTasks.length > (isMobile ? 3 : 5) && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{boardTasks.length - (isMobile ? 3 : 5)} مهمة أخرى
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* تبويب جميع المهام */}
        <TabsContent value="all-tasks" className="space-y-4">
          {/* Drop zones for boards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {mainBoards.map(board => (
              <div
                key={`drop-${board.id}`}
                data-board-id={board.id}
                className={`p-3 rounded-lg border-2 border-dashed text-center transition-colors ${
                  dragOverBoardId === board.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/30'
                }`}
                onDragOver={(e) => handleDragOver(e, board.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, board.id)}
              >
                <div className="text-xs text-muted-foreground">
                  {board.title}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  اسحب المهام هنا
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <div className="text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">لا توجد مهام</p>
                    <p className="text-sm">ابدأ بإضافة مهمة جديدة</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              tasks.map(task => {
                const board = boards.find(b => b.id === task.boardId);
                return (
                  <Card 
                    key={task.id} 
                    data-task-id={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, task.id)}
                    className={`border-2 border-primary/20 transition-all duration-200 ${
                      draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                    } ${isTouch ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleCompletion(task.id, task.status)}
                            className="h-3 w-3 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-medium text-sm leading-tight ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleCompletion(task.id, task.status)}>
                              <CheckCircle className="h-4 w-4 ml-2" />
                              {task.status === 'completed' ? 'إلغاء التحديد' : 'تحديد كمكتمل'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                              <Edit2 className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveTask(task.id)}>
                              <Archive className="h-4 w-4 ml-2" />
                              أرشفة
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteTask(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : task.difficulty === 'hard' ? 'صعب' : 'خبير'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {board?.title || 'قسم غير محدد'}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => handleQuickStatusChange(task.id, task.status)}
                        >
                          تغيير الحالة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => onEditTask(task)}
                        >
                          تعديل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* تبويب الأقسام */}
        <TabsContent value="boards" className="space-y-4">
          <div className="grid gap-3">
            {mainBoards.map(board => {
              const subBoardsForBoard = subBoards.filter(sub => sub.parentId === board.id);
              return (
                <Card key={board.id} className="border-2 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {board.color && (
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: board.color }}
                          />
                        )}
                        <h3 className="font-semibold">{board.title}</h3>
                        {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {subBoardsForBoard.length} قسم فرعي
                      </Badge>
                    </div>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-3">{board.description}</p>
                    )}
                    {subBoardsForBoard.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-accent">الأقسام الفرعية:</h4>
                        {subBoardsForBoard.map(subBoard => (
                          <div key={subBoard.id} className="flex items-center gap-2 p-2 bg-accent/5 rounded">
                            <div className="w-3 h-3 rounded-full bg-accent" />
                            <span className="text-sm">{subBoard.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* تبويب الإضافة */}
        <TabsContent value="add" className="space-y-4">
          <div className="grid gap-4">
            {/* إضافة مهمة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  إضافة مهمة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مهمة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isMobile ? 'mx-4 max-w-sm' : 'sm:max-w-md'}`}>
                    <DialogHeader>
                      <DialogTitle className={isMobile ? 'text-lg' : ''}>إضافة مهمة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">القسم</label>
                        <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainBoards.map(board => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">عنوان المهمة</label>
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="أدخل عنوان المهمة"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="أدخل وصف المهمة"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">الأولوية</label>
                          <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">منخفضة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">الصعوبة</label>
                          <Select value={newTaskDifficulty} onValueChange={(value: TaskDifficulty) => setNewTaskDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">سهلة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="hard">صعبة</SelectItem>
                              <SelectItem value="expert">خبير</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddTask} className="flex-1">
                          إضافة المهمة
                        </Button>
                        <Button variant="outline" onClick={() => setNewTaskOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة قسم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-accent" />
                  إضافة قسم جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <FolderPlus className="h-4 w-4 ml-2" />
                      إضافة قسم
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isMobile ? 'mx-4 max-w-sm' : 'sm:max-w-md'}`}>
                    <DialogHeader>
                      <DialogTitle className={isMobile ? 'text-lg' : ''}>إضافة قسم جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">عنوان القسم</label>
                        <Input
                          value={newBoardTitle}
                          onChange={(e) => setNewBoardTitle(e.target.value)}
                          placeholder="أدخل عنوان القسم"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newBoardDescription}
                          onChange={(e) => setNewBoardDescription(e.target.value)}
                          placeholder="أدخل وصف القسم"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddBoard} className="flex-1">
                          إضافة القسم
                        </Button>
                        <Button variant="outline" onClick={() => setNewBoardOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة قسم فرعي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  إضافة قسم فرعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newSubBoardOpen} onOpenChange={setNewSubBoardOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Layers className="h-4 w-4 ml-2" />
                      إضافة قسم فرعي
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isMobile ? 'mx-4 max-w-sm' : 'sm:max-w-md'}`}>
                    <DialogHeader>
                      <DialogTitle className={isMobile ? 'text-lg' : ''}>إضافة قسم فرعي</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">القسم الرئيسي</label>
                        <Select value={parentBoardId} onValueChange={setParentBoardId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم الرئيسي" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainBoards.map(board => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">عنوان القسم الفرعي</label>
                        <Input
                          value={newSubBoardTitle}
                          onChange={(e) => setNewSubBoardTitle(e.target.value)}
                          placeholder="أدخل عنوان القسم الفرعي"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newSubBoardDescription}
                          onChange={(e) => setNewSubBoardDescription(e.target.value)}
                          placeholder="أدخل وصف القسم الفرعي"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddSubBoard} className="flex-1">
                          إضافة القسم الفرعي
                        </Button>
                        <Button variant="outline" onClick={() => setNewSubBoardOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة مهام متعددة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  إضافة مهام متعددة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      if (mainBoards.length > 0) {
                        onBulkAdd(mainBoards[0].id);
                      } else {
                        showToast('لا توجد أقسام متاحة', 'error');
                      }
                    }}
                  >
                    <Layers className="h-4 w-4 ml-2" />
                    إضافة مهام متعددة
                  </Button>
                  {mainBoards.length > 1 && (
                    <div className="text-xs text-muted-foreground text-center">
                      سيتم إضافة المهام إلى القسم الأول
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
