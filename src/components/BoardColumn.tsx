// مكون عمود القسم
import { useState, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Plus, GripVertical, Edit2, Layers, Trash2, Copy, Maximize2, Minimize2, ChevronDown, ChevronUp, Archive } from 'lucide-react';
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
}: BoardColumnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`board-collapsed-${board.id}`);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`board-collapsed-${board.id}`, String(isCollapsed));
  }, [isCollapsed, board.id]);

  const taskCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const handleCopyBoardTasks = async () => {
    const success = await copyBoardTasks(board.title, tasks);
    if (success) {
      showToast(`تم نسخ ${tasks.length} مهمة من ${board.title}`, 'success');
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
            isFocused && 'ring-4 ring-primary/30 border-primary shadow-2xl'
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

              <h2 className="font-cairo font-bold text-xl flex-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {board.title}
              </h2>

              <div className="flex items-center gap-2">
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
            <div className="mb-4">
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
                      'overflow-x-auto rounded-xl transition-all duration-300',
                      snapshot.isDraggingOver && 'bg-primary/10 ring-2 ring-primary/30'
                    )}
                  >
                    <TaskTable
                      tasks={tasks}
                      boards={boards}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onDuplicate={onDuplicateTask}
                      onStatusChange={onTaskStatusChange}
                      onToggleComplete={(id) => {
                        const task = tasks.find(t => t.id === id);
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
