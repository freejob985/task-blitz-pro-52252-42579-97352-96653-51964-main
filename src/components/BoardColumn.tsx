// مكون عمود القسم
import { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Plus, GripVertical, Edit2, Layers, Trash2, Copy, Maximize2, Minimize2, ChevronDown, ChevronUp, Archive, Star, Eye, EyeOff, Focus, FolderOpen, ChevronRight } from 'lucide-react';
import type { Board, Task } from '@/types';
import { copyBoardTasks } from '@/lib/clipboard';
import { showToast } from '@/lib/toast';
import { TaskTable } from './TaskTable';
import { SubBoardManager } from './SubBoardManager';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
} from './ui/context-menu';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  board: Board;
  tasks: Task[];
  boards: Board[];
  index: number;
  isFocused?: boolean;
  onToggleFocus: (boardId: string) => void;
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

export function BoardColumn({
  board,
  tasks,
  boards,
  index,
  isFocused = false,
  onToggleFocus,
  onAddTask,
  onEditBoard,
  onDeleteBoard,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onTaskStatusChange,
  onBulkAdd,
  onMoveToBoard,
  onArchiveTask,
  onAddSubBoard,
  onToggleBoardCollapse,
  onToggleSubBoardVisibility,
  onFocusOnBoard,
  hiddenSubBoards,
  focusedBoardId,
}: BoardColumnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`board-collapsed-${board.id}`);
    return saved === 'true';
  });
  const [collapsedSubBoards, setCollapsedSubBoards] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`subboards-collapsed-${board.id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(`board-collapsed-${board.id}`, String(isCollapsed));
  }, [isCollapsed, board.id]);

  useEffect(() => {
    localStorage.setItem(`subboards-collapsed-${board.id}`, JSON.stringify(Array.from(collapsedSubBoards)));
  }, [collapsedSubBoards, board.id]);

  const toggleSubBoardCollapse = (subBoardId: string) => {
    setCollapsedSubBoards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subBoardId)) {
        newSet.delete(subBoardId);
      } else {
        newSet.add(subBoardId);
      }
      return newSet;
    });
  };

  // المهام الخاصة بهذا القسم فقط
  const boardTasks = tasks.filter(t => t.boardId === board.id);
  const taskCount = boardTasks.length;
  const completedCount = boardTasks.filter(t => t.status === 'completed').length;

  const handleCopyBoardTasks = async () => {
    const success = await copyBoardTasks(board.title, boardTasks);
    if (success) {
      showToast(`تم نسخ ${boardTasks.length} مهمة من ${board.title}`, 'success');
    } else {
      showToast('لا توجد مهام لنسخها', 'info');
    }
  };

  return (
    <Draggable draggableId={board.id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                'bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 w-full transition-all duration-300',
                'border-2 border-border/50 shadow-card hover:shadow-hover',
                snapshot.isDragging && 'border-primary shadow-xl scale-[1.02]',
                isFocused && 'ring-4 ring-primary/30 border-primary shadow-2xl',
                focusedBoardId === board.id && 'ring-4 ring-accent/30 border-accent shadow-2xl'
              )}
            >
          {/* رأس القسم - تصميم مميز */}
          <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-4 border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl" />
            
            <div className="relative flex items-center gap-2">
              <div
                {...provided.dragHandleProps}
                className={cn(
                  'p-1.5 rounded-lg hover:bg-primary/10 cursor-grab active:cursor-grabbing',
                  'opacity-0 group-hover:opacity-100 transition-all',
                  isHovered && 'opacity-100'
                )}
              >
                <GripVertical className="h-5 w-5 text-primary" />
              </div>

              <div className="flex items-center gap-3 flex-1">
                {board.color && (
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: board.color }}
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-cairo font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {board.title}
                  </h2>
                  {board.description && (
                    <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
                  )}
                </div>
                {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>

              <div className="flex items-center gap-2">
                {board.category && (
                  <Badge variant="outline" className="text-xs">
                    {board.category}
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className="px-3 py-1 text-sm font-bold bg-primary/20 text-primary border-primary/30"
                >
                  {completedCount}/{taskCount}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-9 w-9 hover:bg-primary/10"
                  title={isCollapsed ? 'إظهار القسم' : 'إخفاء القسم'}
                >
                  {isCollapsed ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronUp className="h-5 w-5 text-primary" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleFocus(board.id)}
                  className="h-9 w-9 hover:bg-primary/10"
                  title={isFocused ? 'إلغاء التركيز' : 'التركيز على هذا القسم'}
                >
                  {isFocused ? <Minimize2 className="h-5 w-5 text-primary" /> : <Maximize2 className="h-5 w-5 text-primary" />}
                </Button>

                {/* زر التركيز على القسم */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFocusOnBoard(board.id)}
                  className="h-9 w-9 hover:bg-accent/10"
                  title={focusedBoardId === board.id ? 'إلغاء التركيز' : 'التركيز على هذا القسم'}
                >
                  <Focus className={`h-5 w-5 ${focusedBoardId === board.id ? 'text-accent' : 'text-muted-foreground'}`} />
                </Button>

                {/* زر إخفاء/إظهار الأقسام الفرعية */}
                {!board.parentId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleSubBoardVisibility(board.id)}
                    className="h-9 w-9 hover:bg-accent/10"
                    title={hiddenSubBoards.has(board.id) ? 'إظهار الأقسام الفرعية' : 'إخفاء الأقسام الفرعية'}
                  >
                    {hiddenSubBoards.has(board.id) ? 
                      <EyeOff className="h-5 w-5 text-muted-foreground" /> : 
                      <Eye className="h-5 w-5 text-accent" />
                    }
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-primary/10"
                    >
                      <MoreVertical className="h-5 w-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={handleCopyBoardTasks}>
                      <Copy className="ml-2 h-4 w-4" />
                      نسخ جميع المهام ({taskCount})
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEditBoard(board)}>
                      <Edit2 className="ml-2 h-4 w-4" />
                      إعادة تسمية القسم
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkAdd(board.id)}>
                      <Layers className="ml-2 h-4 w-4" />
                      إضافة مهام متعددة
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteBoard(board.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف القسم
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* شريط التقدم */}
            {taskCount > 0 && (
              <div className="mt-3 space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${(completedCount / taskCount) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((completedCount / taskCount) * 100)}% مكتمل
                </p>
              </div>
            )}
          </div>

          {/* إدارة الأقسام الفرعية */}
          {!board.parentId && (
            <div className="mb-4 p-3 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg border border-accent/20">
              <SubBoardManager
                board={board}
                allBoards={boards}
                onAddSubBoard={onAddSubBoard}
                onToggleCollapse={onToggleBoardCollapse}
                onEditBoard={onEditBoard}
                onDeleteBoard={onDeleteBoard}
                onAddTask={onAddTask}
                onBulkAdd={onBulkAdd}
              />
            </div>
          )}

          {/* عرض الأقسام الفرعية */}
          {!board.parentId && !hiddenSubBoards.has(board.id) && (
            <div className="space-y-4 mt-24">
              {/* خط فاصل بصري للأقسام الفرعية */}
              <div className="flex items-center justify-center py-8 mb-10">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
                <div className="px-6 py-2 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full border border-accent/30 shadow-sm">
                  <h3 className="font-cairo font-bold text-lg text-accent">
                    الأقسام الفرعية
                  </h3>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
              </div>
              <div className="flex items-center justify-center mb-6">
                <Badge variant="outline" className="text-sm bg-accent/5 text-accent border-accent/30">
                  {boards.filter(subBoard => subBoard.parentId === board.id).length} قسم فرعي
                </Badge>
              </div>
              {boards.filter(subBoard => subBoard.parentId === board.id).length > 0 ? (
                <div className="space-y-16">
                  {boards
                    .filter(subBoard => subBoard.parentId === board.id)
                    .map((subBoard, index) => {
                    const subBoardTasks = tasks.filter(t => t.boardId === subBoard.id);
                    return (
                      <div key={subBoard.id} className="relative">
                        {/* خط التوصيل بين الأقسام */}
                        {index > 0 && (
                          <div className="absolute -top-3 left-8 w-px h-3 bg-gradient-to-b from-primary/30 to-transparent" />
                        )}
                        
                        <div className="border-2 border-primary/20 rounded-xl p-5 bg-gradient-to-br from-card/95 to-muted/30 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {/* زر الطي/الظهور للقسم الفرعي */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-primary/10"
                                onClick={() => toggleSubBoardCollapse(subBoard.id)}
                                title={collapsedSubBoards.has(subBoard.id) ? 'إظهار القسم الفرعي' : 'إخفاء القسم الفرعي'}
                              >
                                {collapsedSubBoards.has(subBoard.id) ? 
                                  <ChevronRight className="h-4 w-4 text-primary" /> : 
                                  <ChevronDown className="h-4 w-4 text-primary" />
                                }
                              </Button>

                              {/* أيقونة القسم الفرعي المميزة */}
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div 
                                    className="w-5 h-5 rounded-lg border-2 border-white shadow-md"
                                    style={{ backgroundColor: subBoard.color || '#8b5cf6' }}
                                  />
                                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white animate-pulse" />
                                </div>
                                <ChevronRight className="w-4 h-4 text-primary/60" />
                                <FolderOpen className="w-6 h-6 text-accent" />
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <h3 className="font-cairo font-bold text-lg text-foreground">
                                  {subBoard.title}
                                </h3>
                                {subBoard.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {subBoard.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                {subBoardTasks.length} مهمة
                              </Badge>
                              {subBoardTasks.filter(t => t.status === 'completed').length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-accent/30">
                                  {subBoardTasks.filter(t => t.status === 'completed').length} مكتملة
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onAddTask(subBoard.id)}
                                className="h-7 px-2 hover:bg-primary/10"
                              >
                                <Plus className="h-3 w-3 ml-1" />
                                مهمة
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onBulkAdd(subBoard.id)}
                                className="h-7 px-2 hover:bg-accent/10"
                              >
                                <Layers className="h-3 w-3 ml-1" />
                                متعددة
                              </Button>
                            </div>
                          </div>
                      
                          {/* محتوى القسم الفرعي القابل للطي */}
                          <Collapsible open={!collapsedSubBoards.has(subBoard.id)}>
                            <CollapsibleContent className="space-y-4">
                              {/* شريط التقدم للأقسام الفرعية */}
                              {subBoardTasks.length > 0 && (
                                <div className="mb-4 space-y-2">
                                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                      style={{ 
                                        width: `${(subBoardTasks.filter(t => t.status === 'completed').length / subBoardTasks.length) * 100}%` 
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground text-center font-medium">
                                    {Math.round((subBoardTasks.filter(t => t.status === 'completed').length / subBoardTasks.length) * 100)}% مكتمل
                                  </p>
                                </div>
                              )}
                          
                              {/* رسالة ترحيبية للأقسام الفرعية */}
                              {subBoardTasks.length === 0 && (
                                <div className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                                  <p className="text-xs text-primary text-center font-medium">
                                    🎯 هذا القسم الفرعي جاهز لاستقبال المهام
                                  </p>
                                </div>
                              )}
                          
                              <Droppable droppableId={subBoard.id} type="task">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      'min-h-[120px] rounded-lg transition-all duration-300 border-2 border-dashed border-muted/50 bg-gradient-to-br from-background/50 to-muted/20',
                                      snapshot.isDraggingOver && 'bg-primary/10 ring-2 ring-primary/30 border-primary/50 scale-[1.02]'
                                    )}
                                  >
                                {subBoardTasks.length > 0 ? (
                                  <TaskTable
                                    tasks={subBoardTasks}
                                    boards={boards}
                                    onEdit={onEditTask}
                                    onDelete={onDeleteTask}
                                    onDuplicate={onDuplicateTask}
                                    onStatusChange={onTaskStatusChange}
                                    onToggleComplete={(id) => {
                                      const task = subBoardTasks.find(t => t.id === id);
                                      if (task) {
                                        onTaskStatusChange(id, task.status === 'completed' ? 'waiting' : 'completed');
                                      }
                                    }}
                                    onMoveToBoard={onMoveToBoard}
                                    onArchive={onArchiveTask}
                                  />
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                                    <p className="text-sm">لا توجد مهام في هذا القسم الفرعي</p>
                                    <p className="text-xs mt-1">اسحب مهام هنا أو أضف مهمة جديدة</p>
                                    <div className="mt-2 text-xs text-primary/70">
                                      💡 يمكنك سحب المهام من الأقسام الأخرى إلى هنا
                                    </div>
                                    <div className="mt-1 text-xs text-accent/70">
                                      🎯 السحب والإفلات يعمل بين جميع الأقسام
                                    </div>
                                  </div>
                                )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                  <p className="text-sm">لا توجد أقسام فرعية</p>
                  <p className="text-xs mt-1">استخدم زر إضافة قسم فرعي أعلاه لإنشاء قسم جديد</p>
                  <div className="mt-2 text-xs text-primary/70">
                    💡 الأقسام الفرعية تساعدك في تنظيم المهام بشكل أفضل
                  </div>
                  <div className="mt-1 text-xs text-accent/70">
                    🎯 يمكنك سحب المهام بين الأقسام الرئيسية والفرعية
                  </div>
                </div>
              )}
            </div>
          )}

          {/* رسالة الأقسام الفرعية المخفية */}
          {!board.parentId && hiddenSubBoards.has(board.id) && (
            <div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-muted">
              <p className="text-sm">الأقسام الفرعية مخفية</p>
              <p className="text-xs mt-1">انقر على زر العين لإظهارها</p>
            </div>
          )}

          {/* محتوى القسم القابل للطي */}
          <Collapsible open={!isCollapsed}>
            <CollapsibleContent className="space-y-4">
              {/* جدول المهام */}
              <Droppable droppableId={board.id} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'overflow-x-auto rounded-xl transition-all duration-300 border-2 border-dashed border-transparent',
                      snapshot.isDraggingOver && 'bg-primary/10 ring-2 ring-primary/30 border-primary/50 scale-[1.02]'
                    )}
                  >
                    <TaskTable
                      tasks={boardTasks}
                      boards={boards}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onDuplicate={onDuplicateTask}
                      onStatusChange={onTaskStatusChange}
                      onToggleComplete={(id) => {
                        const task = boardTasks.find(t => t.id === id);
                        if (task) {
                          onTaskStatusChange(id, task.status === 'completed' ? 'waiting' : 'completed');
                        }
                      }}
                      onMoveToBoard={onMoveToBoard}
                      onArchive={onArchiveTask}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* زر إضافة مهمة - تصميم مميز */}
              <div className="relative p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
                <Button
                  onClick={() => onAddTask(board.id)}
                  variant="ghost"
                  className="w-full justify-start gap-2 hover:bg-primary/10 text-primary font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  إضافة مهمة جديدة
                </Button>
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  💡 يمكنك أيضاً سحب المهام من الأقسام الأخرى إلى هنا
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
          </ContextMenuTrigger>

      {/* قائمة السياق للقسم */}
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="font-cairo">إجراءات القسم</ContextMenuLabel>
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onToggleFocus(board.id)} className="font-tajawal cursor-pointer">
          {isFocused ? <Minimize2 className="ml-2 h-4 w-4 text-primary" /> : <Maximize2 className="ml-2 h-4 w-4 text-primary" />}
          <span>{isFocused ? 'إلغاء التركيز' : 'التركيز على هذا القسم'}</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => setIsCollapsed(!isCollapsed)} className="font-tajawal cursor-pointer">
          {isCollapsed ? <ChevronDown className="ml-2 h-4 w-4 text-primary" /> : <ChevronUp className="ml-2 h-4 w-4 text-primary" />}
          <span>{isCollapsed ? 'إظهار القسم' : 'إخفاء القسم'}</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCopyBoardTasks} className="font-tajawal cursor-pointer">
          <Copy className="ml-2 h-4 w-4 text-primary" />
          <span>نسخ جميع المهام ({taskCount})</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onAddTask(board.id)} className="font-tajawal cursor-pointer">
          <Plus className="ml-2 h-4 w-4 text-primary" />
          <span>إضافة مهمة جديدة</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onBulkAdd(board.id)} className="font-tajawal cursor-pointer">
          <Layers className="ml-2 h-4 w-4 text-accent" />
          <span>إضافة مهام متعددة</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onEditBoard(board)} className="font-tajawal cursor-pointer">
          <Edit2 className="ml-2 h-4 w-4" />
          <span>إعادة تسمية القسم</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={() => onDeleteBoard(board.id)} 
          className="font-tajawal cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          <span>حذف القسم</span>
        </ContextMenuItem>
      </ContextMenuContent>
        </ContextMenu>
      )}
    </Draggable>
  );
}
