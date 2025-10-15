// مكونات طرق العرض المختلفة للأقسام
import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Grid, List, Calendar, Kanban, LayoutGrid, Table2, BarChart3, PieChart, Plus, FolderTree, Layers, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn, getDueDateInfo } from '@/lib/utils';
import type { Board, Task } from '@/types';

export type ViewMode = 'default' | 'grid' | 'list' | 'calendar' | 'kanban' | 'table' | 'chart';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  const viewModes = [
    { id: 'default', label: 'الافتراضي', icon: LayoutGrid, description: 'العرض الافتراضي' },
    { id: 'grid', label: 'شبكة', icon: Grid, description: 'عرض شبكي' },
    { id: 'list', label: 'قائمة', icon: List, description: 'عرض قائمة' },
    { id: 'calendar', label: 'تقويم', icon: Calendar, description: 'عرض تقويمي' },
    { id: 'kanban', label: 'كانبان', icon: Kanban, description: 'لوحة كانبان' },
    { id: 'table', label: 'جدول', icon: Table2, description: 'عرض جدولي' },
    { id: 'chart', label: 'رسوم بيانية', icon: BarChart3, description: 'رسوم بيانية' },
  ] as const;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">طريقة العرض:</span>
      <div className="flex gap-1">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.id}
              variant={currentMode === mode.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange(mode.id)}
              className={cn(
                'h-8 px-3 gap-2',
                currentMode === mode.id && 'bg-primary text-primary-foreground'
              )}
              title={mode.description}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// مكون العرض الافتراضي (الموجود حالياً)
interface DefaultViewProps {
  boards: Board[];
  tasks: Task[];
  onAddTask: (boardId: string) => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: Task) => void;
  onTaskStatusChange: (id: string, status: Task['status']) => void;
  onBulkAdd: (boardId: string) => void;
  onMoveToBoard: (taskId: string, boardId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onAddSubBoard: (parentId: string, title: string) => void;
  onToggleBoardCollapse: (boardId: string) => void;
  onToggleSubBoardVisibility: (boardId: string) => void;
  onFocusOnBoard: (boardId: string) => void;
  hiddenSubBoards: Set<string>;
  focusedBoardId?: string | null;
}

export function DefaultView(props: DefaultViewProps) {
  const mainBoards = props.boards.filter(board => !board.parentId);
  
  if (mainBoards.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold mb-2">لا توجد أقسام</h3>
        <p className="text-sm mb-4">ابدأ بإنشاء قسم جديد لتنظيم مهامك</p>
        <Button onClick={() => props.onAddTask('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء قسم جديد
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {mainBoards.map((board, index) => (
        <div key={board.id} className="w-full">
          {/* سيتم استيراد BoardColumn هنا */}
          <div className="text-center p-8 text-muted-foreground">
            <p>عرض افتراضي - سيتم ربط BoardColumn هنا</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// مكون العرض الشبكي
export function GridView(props: DefaultViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4">
      {props.boards
        .filter(board => !board.parentId)
        .map((board) => {
          const boardTasks = props.tasks.filter(t => t.boardId === board.id);
          const completedCount = boardTasks.filter(t => t.status === 'completed').length;
          const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;

          return (
            <div
              key={board.id}
              className="bg-gradient-to-br from-card to-card/80 rounded-2xl p-8 border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {board.color && (
                    <div 
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: board.color }}
                    />
                  )}
                  <h3 className="font-bold text-xl text-foreground">{board.title}</h3>
                </div>
                <Badge variant="secondary" className="text-sm font-semibold px-4 py-2">
                  {boardTasks.length} مهمة
                </Badge>
              </div>
              
              {board.description && (
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                  {board.description}
                </p>
              )}

              {/* عرض المهام */}
              <Droppable droppableId={board.id} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 mb-6 rounded-xl transition-all duration-300 ${
                      snapshot.isDraggingOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    {boardTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl text-sm hover:bg-muted/70 cursor-pointer transition-all duration-200 ${
                              snapshot.isDragging ? 'rotate-1 scale-105 shadow-lg' : 'hover:shadow-md'
                            }`}
                            onClick={() => props.onEditTask(task)}
                          >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                      }}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        task.status === 'completed' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`truncate block ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                      {task.dueDate && (() => {
                        const dueDateInfo = getDueDateInfo(task.dueDate);
                        return dueDateInfo ? (
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 mt-1 ${dueDateInfo.color} border-current/20`}
                          >
                            {dueDateInfo.text}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    {task.priority && (
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs h-4 px-1"
                      >
                        {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="space-y-4">
                <div className="flex justify-between text-base font-semibold text-muted-foreground">
                  <span>التقدم</span>
                  <span className="text-primary font-bold text-lg">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 text-sm px-6 flex-1 hover:bg-primary/10"
                  onClick={() => props.onAddTask(board.id)}
                >
                  إضافة مهمة
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 text-sm px-6 hover:bg-muted/50"
                  onClick={() => props.onEditBoard(board)}
                >
                  تعديل
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}

// مكون عرض القائمة
export function ListView(props: DefaultViewProps) {
  return (
    <div className="space-y-8 p-4">
      {props.boards
        .filter(board => !board.parentId)
        .map((board) => {
          const boardTasks = props.tasks.filter(t => t.boardId === board.id);
          const completedCount = boardTasks.filter(t => t.status === 'completed').length;
          const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;

          return (
            <div key={board.id} className="bg-gradient-to-br from-card to-card/80 rounded-2xl border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
              {/* رأس القسم */}
              <div className="relative p-8 border-b border-border/50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                {/* خلفية زخرفية */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:to-accent/10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 dark:bg-primary/20 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 dark:bg-accent/20 rounded-full translate-y-12 -translate-x-12"></div>
                
                {/* المحتوى */}
                <div className="relative z-10">
                  {/* العنوان والوصف */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5 flex-1">
                      {board.color && (
                        <div 
                          className="w-8 h-8 rounded-full shadow-lg flex-shrink-0 ring-2 ring-white/20 dark:ring-slate-700/50"
                          style={{ backgroundColor: board.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-3xl text-slate-800 dark:text-slate-100 truncate mb-3 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          {board.title}
                        </h3>
                        {board.description && (
                          <p className="text-lg text-slate-600 dark:text-slate-300 truncate leading-relaxed font-medium">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الإحصائيات والتقدم */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-10">
                      {/* عدد المهام */}
                      <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 min-w-[100px] shadow-lg border border-white/20 dark:border-slate-700/50">
                        <div className="text-3xl font-bold text-primary mb-2">{boardTasks.length}</div>
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">مهمة</div>
                      </div>

                      {/* المهام المكتملة */}
                      <div className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 min-w-[100px] shadow-lg border border-white/20 dark:border-slate-700/50">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{completedCount}</div>
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">مكتملة</div>
                      </div>

                      {/* شريط التقدم */}
                      <div className="flex-1 max-w-[350px]">
                        <div className="flex justify-between text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">
                          <span>التقدم</span>
                          <span className="text-primary dark:text-primary-foreground font-black text-xl">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-6 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden shadow-inner border border-white/30 dark:border-slate-600/30">
                          <div 
                            className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent transition-all duration-1000 shadow-sm"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex gap-4 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-12 text-base px-8 hover:bg-primary/20 border-primary/40 dark:border-primary/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                      onClick={() => props.onAddTask(board.id)}
                    >
                      إضافة مهمة
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-12 text-base px-8 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                      onClick={() => props.onEditBoard(board)}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-12 text-base px-8 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                      onClick={() => props.onDeleteBoard(board.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </div>

              {/* عرض المهام */}
              <div className="p-8">
                {boardTasks.length > 0 ? (
                  <Droppable droppableId={board.id} type="task">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-4 rounded-xl transition-all duration-300 ${
                          snapshot.isDraggingOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                        }`}
                      >
                        {boardTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-5 p-5 bg-gradient-to-r from-muted/20 to-muted/40 rounded-xl hover:bg-muted/60 cursor-pointer transition-all duration-200 ${
                                  snapshot.isDragging ? 'rotate-1 scale-105 shadow-lg' : 'hover:shadow-md'
                                }`}
                                onClick={() => props.onEditTask(task)}
                              >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                          }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            task.status === 'completed' 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {task.status === 'completed' && '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (() => {
                            const dueDateInfo = getDueDateInfo(task.dueDate);
                            return dueDateInfo ? (
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-0.5 mt-1 ${dueDateInfo.color} border-current/20`}
                              >
                                {dueDateInfo.text}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.priority && (
                            <Badge 
                              variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs h-5 px-2"
                            >
                              {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          )}
                          <Badge 
                            variant={task.status === 'completed' ? 'default' : 'outline'}
                            className="text-xs h-5 px-2"
                          >
                            {task.status === 'completed' ? 'مكتملة' : 
                             task.status === 'working' ? 'قيد التنفيذ' : 'في الانتظار'}
                          </Badge>
                        </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">لا توجد مهام في هذا القسم</p>
                    <p className="text-xs mt-1">انقر على "إضافة مهمة" لإنشاء مهمة جديدة</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

// مكون عرض التقويم
export function CalendarView(props: DefaultViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // وظائف التنقل بين الشهور
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // ترجمة الشهور الميلادية للعربية
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  // إنشاء أيام الشهر
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  
  // إضافة الأيام الفارغة في بداية الشهر
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // إضافة أيام الشهر
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // تجميع المهام حسب التاريخ
  const tasksByDate = props.tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToPreviousMonth}
            className="hover:bg-primary/10"
          >
            الشهر السابق
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToToday}
            className="hover:bg-accent/10"
          >
            اليوم
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={goToNextMonth}
            className="hover:bg-primary/10"
          >
            الشهر التالي
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-20" />;
          }
          
          const dateKey = `${currentYear}-${currentMonth}-${day}`;
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = day === today.getDate() && currentMonth === today.getMonth();
          
          return (
            <Droppable key={day} droppableId={`calendar-${dateKey}`} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "h-20 p-1 border rounded-lg hover:bg-muted/50 transition-colors relative",
                    isToday && "bg-primary/10 border-primary",
                    snapshot.isDraggingOver && "bg-accent/10 border-accent ring-2 ring-accent/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary font-bold"
                    )}>
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1">
                        {dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task, taskIndex) => (
                      <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "text-xs p-1 rounded truncate cursor-pointer transition-all duration-200",
                              task.status === 'completed' ? 'bg-green-100 text-green-800 line-through' : 
                              task.status === 'working' ? 'bg-blue-100 text-blue-800' : 'bg-primary/10 text-primary',
                              snapshot.isDragging && 'rotate-1 scale-105 shadow-lg'
                            )}
                            title={`${task.title} - ${task.status === 'completed' ? 'مكتملة' : 
                                   task.status === 'working' ? 'قيد التنفيذ' : 'في الانتظار'}`}
                            onClick={() => props.onEditTask(task)}
                          >
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                                }}
                                className={cn(
                                  "w-3 h-3 rounded border flex items-center justify-center text-xs",
                                  task.status === 'completed' 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'border-gray-300 hover:border-green-500'
                                )}
                              >
                                {task.status === 'completed' && '✓'}
                              </button>
                              <span className="truncate">{task.title}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayTasks.length - 2} أخرى
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </div>
  );
}

// مكون عرض كانبان
export function KanbanView(props: DefaultViewProps) {
  const statuses = ['waiting', 'working', 'completed'] as const;
  const statusLabels = {
    'waiting': 'في الانتظار',
    'working': 'قيد التنفيذ', 
    'completed': 'مكتملة'
  };

  return (
    <div className="flex gap-8 overflow-x-auto pb-8 p-4">
      {statuses.map(status => {
        const statusTasks = props.tasks.filter(task => task.status === status);
        return (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-foreground">
                  {statusLabels[status]}
                </h3>
                <Badge variant="secondary" className="text-sm font-semibold px-4 py-2">
                  {statusTasks.length} مهمة
                </Badge>
              </div>
              <Droppable droppableId={`kanban-${status}`} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[600px] rounded-xl transition-all duration-300 ${
                      snapshot.isDraggingOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    {statusTasks.length > 0 ? (
                      statusTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-gradient-to-br from-card to-card/80 p-5 rounded-xl border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer ${
                                snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl' : 'hover:scale-[1.02]'
                              }`}
                              onClick={() => props.onEditTask(task)}
                            >
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                          }}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 ${
                            task.status === 'completed' 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {task.status === 'completed' && '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm line-clamp-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {props.boards.find(b => b.id === task.boardId)?.title || 'غير محدد'}
                        </Badge>
                        {task.priority && (
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            📅 {new Date(task.dueDate).toLocaleDateString('en-GB')}
                          </div>
                          {(() => {
                            const dueDateInfo = getDueDateInfo(task.dueDate);
                            return dueDateInfo ? (
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-0.5 ${dueDateInfo.color} border-current/20`}
                              >
                                {dueDateInfo.text}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">لا توجد مهام</p>
                        <p className="text-xs mt-1">اسحب مهام هنا أو أضف مهمة جديدة</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// مكون عرض الجدول
export function TableView(props: DefaultViewProps) {
  const [showMainSections, setShowMainSections] = useState(true);
  const [showSubSections, setShowSubSections] = useState(true);
  const [showAllTasks, setShowAllTasks] = useState(true);

  return (
    <div className="space-y-16 p-4">
      {/* أزرار التحكم في العرض */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-xl">
        <Button
          variant={showMainSections ? "default" : "outline"}
          onClick={() => setShowMainSections(!showMainSections)}
          className="gap-2"
        >
          <FolderTree className="h-4 w-4" />
          الأقسام الرئيسية
        </Button>
        <Button
          variant={showSubSections ? "default" : "outline"}
          onClick={() => setShowSubSections(!showSubSections)}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          الأقسام الفرعية
        </Button>
        <Button
          variant={showAllTasks ? "default" : "outline"}
          onClick={() => setShowAllTasks(!showAllTasks)}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          جميع المهام
        </Button>
      </div>
      {/* جدول الأقسام الرئيسية */}
      {showMainSections && (
        <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl border-2 border-primary/30 shadow-xl overflow-hidden ring-2 ring-primary/10">
        <div className="p-8 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl ring-2 ring-primary/20">
              <FolderTree className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">الأقسام الرئيسية</h3>
            <Badge variant="outline" className="text-base px-4 py-2 border-primary/30 bg-primary/5">
              {props.boards.filter(board => !board.parentId).length} قسم رئيسي
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-muted/60 to-muted/40">
              <tr>
                <th className="text-right p-6 text-base font-bold text-foreground">القسم</th>
                <th className="text-right p-6 text-base font-bold text-foreground">الوصف</th>
                <th className="text-right p-6 text-base font-bold text-foreground">المهام</th>
                <th className="text-right p-6 text-base font-bold text-foreground">المكتملة</th>
                <th className="text-right p-6 text-base font-bold text-foreground">التقدم</th>
                <th className="text-right p-6 text-base font-bold text-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {props.boards
                .filter(board => !board.parentId)
                .map((board) => {
                  const boardTasks = props.tasks.filter(t => t.boardId === board.id);
                  const completedCount = boardTasks.filter(t => t.status === 'completed').length;
                  const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;

                  return (
                    <tr key={board.id} className="border-t border-primary/20 hover:bg-primary/5 transition-all duration-200">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-1 bg-primary/10 rounded-lg ring-1 ring-primary/20">
                            <FolderTree className="h-4 w-4 text-primary" />
                          </div>
                          {board.color && (
                            <div 
                              className="w-4 h-4 rounded-full ring-2 ring-primary/20"
                              style={{ backgroundColor: board.color }}
                            />
                          )}
                          <span className="font-semibold text-lg text-primary">{board.title}</span>
                          <Badge variant="outline" className="text-xs px-2 py-1 border-primary/30 bg-primary/5">
                            رئيسي
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {board.description || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary">{boardTasks.length}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{completedCount}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => props.onAddTask(board.id)}
                          >
                            إضافة
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => props.onEditBoard(board)}
                          >
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-destructive"
                            onClick={() => props.onDeleteBoard(board.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* خط فاصل بصري مع تباعد أكبر */}
      <div className="flex items-center justify-center py-16">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        <div className="px-8 py-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full border-2 border-accent/30 shadow-lg">
          <span className="text-lg font-bold text-accent">الأقسام الفرعية</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      </div>

      {/* جدول الأقسام الفرعية */}
      {showSubSections && props.boards.filter(board => board.parentId).length > 0 && (
        <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl border-2 border-accent/30 shadow-lg overflow-hidden mt-20">
          <div className="p-6 border-b border-accent/20 bg-gradient-to-r from-accent/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg ring-1 ring-accent/30">
                <Layers className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-bold text-2xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">الأقسام الفرعية</h3>
              <Badge variant="outline" className="text-sm px-3 py-1 border-accent/30 bg-accent/5">
                {props.boards.filter(board => board.parentId).length} قسم فرعي
              </Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-muted/60 to-muted/40">
                <tr>
                  <th className="text-right p-6 text-base font-bold text-foreground">القسم الفرعي</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">القسم الرئيسي</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">الوصف</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">المهام</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">المكتملة</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">التقدم</th>
                  <th className="text-right p-6 text-base font-bold text-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {props.boards
                  .filter(board => board.parentId)
                  .map((board) => {
                    const boardTasks = props.tasks.filter(t => t.boardId === board.id);
                    const completedCount = boardTasks.filter(t => t.status === 'completed').length;
                    const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;
                    const parentBoard = props.boards.find(b => b.id === board.parentId);

                    return (
                      <tr key={board.id} className="border-t border-accent/20 hover:bg-accent/5 transition-all duration-200">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-accent/10 rounded-lg ring-1 ring-accent/20">
                              <Layers className="h-4 w-4 text-accent" />
                            </div>
                            {board.color && (
                              <div 
                                className="w-4 h-4 rounded-full ring-2 ring-accent/20"
                                style={{ backgroundColor: board.color }}
                              />
                            )}
                            <span className="font-semibold text-lg text-accent">{board.title}</span>
                            <Badge variant="outline" className="text-xs px-2 py-1 border-accent/30 bg-accent/5">
                              فرعي
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {parentBoard?.title || '-'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {board.description || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{boardTasks.length}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{completedCount}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() => props.onAddTask(board.id)}
                            >
                              إضافة
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2"
                              onClick={() => props.onEditBoard(board)}
                            >
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 text-destructive"
                              onClick={() => props.onDeleteBoard(board.id)}
                            >
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* خط فاصل بصري */}
      <div className="flex items-center justify-center py-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        <div className="px-6 py-2 bg-muted/50 rounded-full border border-border/50">
          <span className="text-sm font-medium text-muted-foreground">جميع المهام</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      </div>

      {/* جدول المهام */}
      {showAllTasks && (
        <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl border-2 border-border/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-2xl text-foreground">جميع المهام</h3>
            <Badge variant="outline" className="text-sm">
              {props.tasks.length} مهمة
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right p-3 text-sm font-medium">المهمة</th>
                <th className="text-right p-3 text-sm font-medium">القسم</th>
                <th className="text-right p-3 text-sm font-medium">الحالة</th>
                <th className="text-right p-3 text-sm font-medium">الأولوية</th>
                <th className="text-right p-3 text-sm font-medium">تاريخ الاستحقاق</th>
                <th className="text-right p-3 text-sm font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {props.tasks.map((task) => {
                const board = props.boards.find(b => b.id === task.boardId);
                return (
                  <tr key={task.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                          }}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                            task.status === 'completed' 
                              ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                              : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                          }`}
                        >
                          {task.status === 'completed' && '✓'}
                        </button>
                        <div className="flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                            }}
                            className={`font-medium text-base cursor-pointer hover:text-primary transition-colors duration-200 select-text ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                          </button>
                          {task.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="text-sm">
                        {board?.title || 'غير محدد'}
                      </Badge>
                    </td>
                    <td className="p-6">
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'outline'}
                          className="text-sm"
                        >
                          {task.status === 'completed' ? 'مكتملة' : 
                           task.status === 'working' ? 'قيد التنفيذ' : 'في الانتظار'}
                        </Badge>
                    </td>
                    <td className="p-6">
                      {task.priority ? (
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {task.dueDate ? (
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString('en-GB')}
                          </div>
                          {(() => {
                            const dueDateInfo = getDueDateInfo(task.dueDate);
                            return dueDateInfo ? (
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-0.5 ${dueDateInfo.color} border-current/20`}
                              >
                                {dueDateInfo.text}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2"
                          onClick={() => props.onEditTask(task)}
                        >
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 text-destructive"
                          onClick={() => props.onDeleteTask(task.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

// مكون الرسوم البيانية
export function ChartView(props: DefaultViewProps) {
  const boardStats = props.boards
    .filter(board => !board.parentId)
    .map(board => {
      const boardTasks = props.tasks.filter(t => t.boardId === board.id);
      const completedCount = boardTasks.filter(t => t.status === 'completed').length;
      const inProgressCount = boardTasks.filter(t => t.status === 'working').length;
      const waitingCount = boardTasks.filter(t => t.status === 'waiting').length;
      
      return {
        board,
        total: boardTasks.length,
        completed: completedCount,
        inProgress: inProgressCount,
        waiting: waitingCount,
        progress: boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0
      };
    });

  const totalTasks = props.tasks.length;
  const totalCompleted = props.tasks.filter(t => t.status === 'completed').length;
  const totalInProgress = props.tasks.filter(t => t.status === 'working').length;
  const totalWaiting = props.tasks.filter(t => t.status === 'waiting').length;
  const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  return (
    <div className="space-y-10 p-4">
      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-2xl border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-4xl font-bold text-primary mb-3">{totalTasks}</div>
          <div className="text-base font-semibold text-muted-foreground">إجمالي المهام</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-8 rounded-2xl border-2 border-green-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-4xl font-bold text-green-600 mb-3">{totalCompleted}</div>
          <div className="text-base font-semibold text-muted-foreground">مكتملة</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-8 rounded-2xl border-2 border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-4xl font-bold text-blue-600 mb-3">{totalInProgress}</div>
          <div className="text-base font-semibold text-muted-foreground">قيد التنفيذ</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-8 rounded-2xl border-2 border-orange-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="text-4xl font-bold text-orange-600 mb-3">{totalWaiting}</div>
          <div className="text-base font-semibold text-muted-foreground">في الانتظار</div>
        </div>
      </div>

      {/* تقدم عام */}
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-2xl border-2 border-border/50 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-foreground">التقدم العام</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-xl font-semibold">
            <span className="text-muted-foreground">إجمالي التقدم</span>
            <span className="text-primary font-bold text-2xl">{Math.round(overallProgress)}%</span>
          </div>
          <div className="h-8 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 shadow-sm"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* توزيع المهام حسب الحالة */}
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-2xl border-2 border-border/50 shadow-lg">
        <h3 className="font-bold text-2xl mb-8 text-foreground">توزيع المهام حسب الحالة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border-2 border-green-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-5xl font-bold text-green-600 mb-3">{totalCompleted}</div>
            <div className="text-base font-semibold text-muted-foreground mb-3">مكتملة</div>
            <div className="text-2xl font-bold text-green-600">
              {totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border-2 border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-5xl font-bold text-blue-600 mb-3">{totalInProgress}</div>
            <div className="text-base font-semibold text-muted-foreground mb-3">قيد التنفيذ</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalTasks > 0 ? Math.round((totalInProgress / totalTasks) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border-2 border-orange-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-5xl font-bold text-orange-600 mb-3">{totalWaiting}</div>
            <div className="text-base font-semibold text-muted-foreground mb-3">في الانتظار</div>
            <div className="text-2xl font-bold text-orange-600">
              {totalTasks > 0 ? Math.round((totalWaiting / totalTasks) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات الأقسام */}
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-2xl border-2 border-border/50 shadow-lg">
        <h3 className="font-bold text-2xl mb-8 text-foreground">إحصائيات الأقسام</h3>
        <div className="space-y-8">
          {boardStats.length > 0 ? (
            boardStats.map(({ board, total, completed, inProgress, waiting, progress }) => (
              <div key={board.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {board.color && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: board.color }}
                      />
                    )}
                    <span className="font-medium">{board.title}</span>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{completed} مكتملة</span>
                    <span>•</span>
                    <span>{inProgress} قيد التنفيذ</span>
                    <span>•</span>
                    <span>{waiting} في الانتظار</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">لا توجد أقسام</p>
              <p className="text-xs mt-1">قم بإنشاء قسم جديد لبدء إدارة المهام</p>
            </div>
          )}
        </div>
      </div>

      {/* المهام الأخيرة */}
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-2xl border-2 border-border/50 shadow-lg">
        <h3 className="font-bold text-2xl mb-8 text-foreground">المهام الأخيرة</h3>
        <div className="space-y-4">
          {props.tasks.slice(0, 5).map((task) => {
            const board = props.boards.find(b => b.id === task.boardId);
            return (
              <div key={task.id} className="flex items-center gap-5 p-5 bg-gradient-to-r from-muted/20 to-muted/40 rounded-xl hover:bg-muted/60 transition-all duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onTaskStatusChange(task.id, task.status === 'completed' ? 'waiting' : 'completed');
                  }}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    task.status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {task.status === 'completed' && '✓'}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {board?.title || 'غير محدد'} • {task.status === 'completed' ? 'مكتملة' : 
                     task.status === 'working' ? 'قيد التنفيذ' : 'في الانتظار'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
                  onClick={() => props.onEditTask(task)}
                >
                  عرض
                </Button>
              </div>
            );
          })}
          {props.tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">لا توجد مهام</p>
              <p className="text-xs mt-1">قم بإنشاء مهمة جديدة لبدء العمل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
