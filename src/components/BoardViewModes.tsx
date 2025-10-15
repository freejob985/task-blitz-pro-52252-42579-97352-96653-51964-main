// مكونات طرق العرض المختلفة للأقسام
import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Grid, List, Calendar, Kanban, LayoutGrid, Table2, BarChart3, PieChart, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {props.boards
        .filter(board => !board.parentId)
        .map((board) => {
          const boardTasks = props.tasks.filter(t => t.boardId === board.id);
          const completedCount = boardTasks.filter(t => t.status === 'completed').length;
          const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;

          return (
            <div
              key={board.id}
              className="bg-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {board.color && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: board.color }}
                    />
                  )}
                  <h3 className="font-semibold text-sm">{board.title}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {boardTasks.length}
                </Badge>
              </div>
              
              {board.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {board.description}
                </p>
              )}

              {/* عرض المهام */}
              <Droppable droppableId={board.id} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 mb-3 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/10' : ''
                    }`}
                  >
                    {boardTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-2 p-2 bg-muted/50 rounded text-xs hover:bg-muted/70 cursor-pointer ${
                              snapshot.isDragging ? 'rotate-1 scale-105' : ''
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
                    <span className={`flex-1 truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
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

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>التقدم</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-1 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2"
                  onClick={() => props.onAddTask(board.id)}
                >
                  إضافة مهمة
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
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
    <div className="space-y-4">
      {props.boards
        .filter(board => !board.parentId)
        .map((board) => {
          const boardTasks = props.tasks.filter(t => t.boardId === board.id);
          const completedCount = boardTasks.filter(t => t.status === 'completed').length;
          const progress = boardTasks.length > 0 ? (completedCount / boardTasks.length) * 100 : 0;

          return (
            <div key={board.id} className="bg-card rounded-lg border">
              {/* رأس القسم */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4 flex-1">
                  {board.color && (
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: board.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{board.title}</h3>
                    {board.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {board.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold">{boardTasks.length}</div>
                      <div className="text-xs text-muted-foreground">مهمة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{completedCount}</div>
                      <div className="text-xs text-muted-foreground">مكتملة</div>
                    </div>
                    <div className="w-16">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>التقدم</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-3"
                    onClick={() => props.onAddTask(board.id)}
                  >
                    إضافة مهمة
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs px-3"
                    onClick={() => props.onEditBoard(board)}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs px-3 text-destructive"
                    onClick={() => props.onDeleteBoard(board.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>

              {/* عرض المهام */}
              <div className="p-4">
                {boardTasks.length > 0 ? (
                  <Droppable droppableId={board.id} type="task">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-primary/10' : ''
                        }`}
                      >
                        {boardTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                                  snapshot.isDragging ? 'rotate-1 scale-105' : ''
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
                             task.status === 'in-progress' ? 'قيد التنفيذ' : 'في الانتظار'}
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
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
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
          {new Date(currentYear, currentMonth).toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">الشهر السابق</Button>
          <Button size="sm" variant="outline">الشهر التالي</Button>
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
            <div
              key={day}
              className={cn(
                "h-20 p-1 border rounded-lg hover:bg-muted/50 transition-colors",
                isToday && "bg-primary/10 border-primary"
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
                {dayTasks.slice(0, 2).map(task => (
                  <div
                    key={task.id}
                    className="text-xs p-1 bg-primary/10 rounded truncate"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTasks.length - 2} أخرى
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// مكون عرض كانبان
export function KanbanView(props: DefaultViewProps) {
  const statuses = ['waiting', 'in-progress', 'completed'] as const;
  const statusLabels = {
    'waiting': 'في الانتظار',
    'in-progress': 'قيد التنفيذ', 
    'completed': 'مكتملة'
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map(status => {
        const statusTasks = props.tasks.filter(task => task.status === status);
        return (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  {statusLabels[status]}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {statusTasks.length}
                </Badge>
              </div>
              <Droppable droppableId={status} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[400px] rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/10' : ''
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
                              className={`bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                snapshot.isDragging ? 'rotate-2 scale-105' : ''
                              }`}
                              onClick={() => props.onEditTask(task)}
                            >
                      <div className="flex items-start gap-2 mb-2">
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
                        <div className="mt-2 text-xs text-muted-foreground">
                          📅 {new Date(task.dueDate).toLocaleDateString('ar-SA')}
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
  return (
    <div className="space-y-4">
      {/* جدول الأقسام */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right p-3 text-sm font-medium">القسم</th>
                <th className="text-right p-3 text-sm font-medium">الوصف</th>
                <th className="text-right p-3 text-sm font-medium">المهام</th>
                <th className="text-right p-3 text-sm font-medium">المكتملة</th>
                <th className="text-right p-3 text-sm font-medium">التقدم</th>
                <th className="text-right p-3 text-sm font-medium">الإجراءات</th>
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
                    <tr key={board.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {board.color && (
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: board.color }}
                            />
                          )}
                          <span className="font-medium">{board.title}</span>
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

      {/* جدول المهام */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">جميع المهام</h3>
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
                    <td className="p-3">
                      <div className="flex items-center gap-2">
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
                        <div>
                          <div className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {board?.title || 'غير محدد'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={task.status === 'completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {task.status === 'completed' ? 'مكتملة' : 
                         task.status === 'in-progress' ? 'قيد التنفيذ' : 'في الانتظار'}
                      </Badge>
                    </td>
                    <td className="p-3">
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
                    <td className="p-3 text-sm text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : '-'}
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
      const inProgressCount = boardTasks.filter(t => t.status === 'in-progress').length;
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
  const totalInProgress = props.tasks.filter(t => t.status === 'in-progress').length;
  const totalWaiting = props.tasks.filter(t => t.status === 'waiting').length;
  const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-primary">{totalTasks}</div>
          <div className="text-sm text-muted-foreground">إجمالي المهام</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
          <div className="text-sm text-muted-foreground">مكتملة</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{totalInProgress}</div>
          <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{totalWaiting}</div>
          <div className="text-sm text-muted-foreground">في الانتظار</div>
        </div>
      </div>

      {/* تقدم عام */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">التقدم العام</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>إجمالي التقدم</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* توزيع المهام حسب الحالة */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">توزيع المهام حسب الحالة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{totalCompleted}</div>
            <div className="text-sm text-green-700 dark:text-green-300">مكتملة</div>
            <div className="text-xs text-green-600 mt-1">
              {totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{totalInProgress}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">قيد التنفيذ</div>
            <div className="text-xs text-blue-600 mt-1">
              {totalTasks > 0 ? Math.round((totalInProgress / totalTasks) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">{totalWaiting}</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">في الانتظار</div>
            <div className="text-xs text-orange-600 mt-1">
              {totalTasks > 0 ? Math.round((totalWaiting / totalTasks) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات الأقسام */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">إحصائيات الأقسام</h3>
        <div className="space-y-4">
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
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">المهام الأخيرة</h3>
        <div className="space-y-2">
          {props.tasks.slice(0, 5).map((task) => {
            const board = props.boards.find(b => b.id === task.boardId);
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
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
                     task.status === 'in-progress' ? 'قيد التنفيذ' : 'في الانتظار'}
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
