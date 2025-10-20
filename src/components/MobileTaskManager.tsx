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

  // ألوان مختلفة لكل قسم لتمييز المهام
  const getBoardColor = (boardId: string) => {
    const colors = [
      'from-blue-500/10 to-blue-600/20 border-blue-300/30',
      'from-green-500/10 to-green-600/20 border-green-300/30',
      'from-purple-500/10 to-purple-600/20 border-purple-300/30',
      'from-orange-500/10 to-orange-600/20 border-orange-300/30',
      'from-pink-500/10 to-pink-600/20 border-pink-300/30',
      'from-indigo-500/10 to-indigo-600/20 border-indigo-300/30',
      'from-teal-500/10 to-teal-600/20 border-teal-300/30',
      'from-rose-500/10 to-rose-600/20 border-rose-300/30',
    ];
    const index = mainBoards.findIndex(board => board.id === boardId);
    return colors[index % colors.length] || colors[0];
  };

  const getSubBoardColor = (parentBoardId: string) => {
    const colors = [
      'from-blue-400/5 to-blue-500/15 border-blue-200/20',
      'from-green-400/5 to-green-500/15 border-green-200/20',
      'from-purple-400/5 to-purple-500/15 border-purple-200/20',
      'from-orange-400/5 to-orange-500/15 border-orange-200/20',
    ];
    const index = mainBoards.findIndex(board => board.id === parentBoardId);
    return colors[index % colors.length] || colors[0];
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

      {/* التبويبات المحسنة والمكبرة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 rounded-2xl p-2 h-16">
          <TabsTrigger 
            value="tasks" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:scale-105 transition-all duration-300 rounded-xl font-semibold text-sm h-12 data-[state=active]:border-2 data-[state=active]:border-primary/30"
          >
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-medium">المهام</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="all-tasks"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:scale-105 transition-all duration-300 rounded-xl font-semibold text-sm h-12 data-[state=active]:border-2 data-[state=active]:border-primary/30"
          >
            <div className="flex flex-col items-center gap-1">
              <Layers className="h-5 w-5" />
              <span className="text-xs font-medium">جميع المهام</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="boards"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:scale-105 transition-all duration-300 rounded-xl font-semibold text-sm h-12 data-[state=active]:border-2 data-[state=active]:border-primary/30"
          >
            <div className="flex flex-col items-center gap-1">
              <FolderPlus className="h-5 w-5" />
              <span className="text-xs font-medium">الأقسام</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="add"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:scale-105 transition-all duration-300 rounded-xl font-semibold text-sm h-12 data-[state=active]:border-2 data-[state=active]:border-primary/30"
          >
            <div className="flex flex-col items-center gap-1">
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">إضافة</span>
            </div>
          </TabsTrigger>
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
                                <div className="space-y-2">
                                  {subBoardTasks.slice(0, 3).map(task => (
                                    <div 
                                      key={task.id} 
                                      data-task-id={task.id}
                                      className={`group bg-gradient-to-r ${getSubBoardColor(subBoard.parentId || '')} rounded-lg border p-3 transition-all duration-300 hover:shadow-md hover:border-accent/40`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={task.status === 'completed'}
                                          onCheckedChange={() => handleToggleCompletion(task.id, task.status)}
                                          className="h-3 w-3 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        />
                                        {getStatusIcon(task.status)}
                                        <span className={`text-sm flex-1 truncate font-medium ${
                                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                        }`}>
                                          {task.title}
                                        </span>
                                        <div className="flex gap-1">
                                          <Badge className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                          </Badge>
                                          <Badge className={`text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                            {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : task.difficulty === 'hard' ? 'صعب' : 'خبير'}
                                          </Badge>
                                        </div>
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

                  {/* مهام القسم الرئيسي المحسنة */}
                  <div className="space-y-2">
                    {boardTasks.slice(0, isMobile ? 3 : 5).map(task => (
                      <div 
                        key={task.id} 
                        data-task-id={task.id}
                        onTouchStart={(e) => handleSwipeStart(e, task.id)}
                        className={`relative group bg-gradient-to-r ${getBoardColor(board.id)} rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                          swipedTaskId === task.id ? 'border-primary/50 bg-primary/5 shadow-lg' : 'hover:border-primary/40'
                        }`}
                        onClick={() => isTouch && handleQuickStatusChange(task.id, task.status)}
                      >
                        <div className="p-4">
                          {/* Header with task title and status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Checkbox for completion */}
                              <div className="flex-shrink-0">
                                <Checkbox
                                  checked={task.status === 'completed'}
                                  onCheckedChange={() => handleToggleCompletion(task.id, task.status)}
                                  className="h-4 w-4 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                              </div>
                              
                              
                              {/* Status icon */}
                              <div className="flex-shrink-0">
                                {getStatusIcon(task.status)}
                              </div>
                              
                              {/* Task title - improved visibility */}
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-base font-semibold leading-tight ${
                                  task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions menu */}
                            <div className="flex-shrink-0 ml-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          </div>
                          
                          {/* Priority and difficulty badges */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                              <Badge className={`text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : task.difficulty === 'hard' ? 'صعب' : 'خبير'}
                              </Badge>
                            </div>
                            
                            {/* Status label and board indicator */}
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground font-medium">
                                {getStatusLabel(task.status)}
                              </div>
                              <div className={`w-3 h-3 rounded-full ${getBoardColor(board.id).split(' ')[0].replace('from-', 'bg-')} border border-white shadow-sm`} 
                                   title={board.title} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Swipe indicator */}
                        {swipedTaskId === task.id && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-primary/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-primary">
                              <ArrowLeft className="h-5 w-5" />
                              <span className="text-sm font-semibold">اضغط لتغيير الحالة</span>
                              <ArrowRight className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {boardTasks.length > (isMobile ? 3 : 5) && (
                      <div className="text-center py-3">
                        <p className="text-sm text-muted-foreground font-medium">
                          +{boardTasks.length - (isMobile ? 3 : 5)} مهمة أخرى
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* تبويب جميع المهام */}
        <TabsContent value="all-tasks" className="space-y-4">

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
                    className={`border-2 transition-all duration-300 hover:shadow-lg group hover:border-primary/40 bg-gradient-to-r ${board ? getBoardColor(board.id) : 'from-gray-500/10 to-gray-600/20 border-gray-300/30'}`}
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
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {board?.title || 'قسم غير محدد'}
                          </div>
                          {board && (
                            <div className={`w-3 h-3 rounded-full ${getBoardColor(board.id).split(' ')[0].replace('from-', 'bg-')} border border-white shadow-sm`} 
                                 title={board.title} />
                          )}
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
