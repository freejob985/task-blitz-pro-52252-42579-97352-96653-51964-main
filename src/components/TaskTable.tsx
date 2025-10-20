// مكون جدول المهام
import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Calendar, Tag, Trash2, Edit, Copy, MoveRight, Archive } from 'lucide-react';
import type { Task, Board } from '@/types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { cn, getDueDateInfo } from '@/lib/utils';
import { getTagClassName, getTagIcon } from '@/lib/tagColors';

interface TaskTableProps {
  tasks: Task[];
  boards: Board[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onTaskDifficultyChange?: (id: string, difficulty: Task['difficulty']) => void;
  onToggleComplete: (id: string) => void;
  onMoveToBoard: (taskId: string, boardId: string) => void;
  onArchive?: (taskId: string) => void;
  boardTitle?: string;
  boardColor?: string;
}

export function TaskTable({
  tasks,
  boards,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onTaskDifficultyChange,
  onToggleComplete,
  onMoveToBoard,
  onArchive,
  boardTitle,
  boardColor,
}: TaskTableProps) {
  // التحقق من الوضع الليلي
  const isDark = document.documentElement.classList.contains('dark');
  const statusLabels: Record<Task['status'], string> = {
    working: 'قيد العمل',
    waiting: 'بانتظار',
    frozen: 'مجمّد',
    completed: 'مكتمل',
  };

  const priorityLabels: Record<Task['priority'], string> = {
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  };

  const priorityColors: Record<Task['priority'], string> = {
    high: 'bg-priority-high text-white',
    medium: 'bg-priority-medium text-white',
    low: 'bg-priority-low text-white',
  };

  const statusColors: Record<Task['status'], string> = {
    working: 'bg-status-working text-white',
    waiting: 'bg-status-waiting text-white',
    frozen: 'bg-status-frozen text-white',
    completed: 'bg-status-completed text-white',
  };

  if (tasks.length === 0) {
    return (
      <div className="overflow-x-auto rounded-xl border-2 border-border/50 bg-card shadow-sm" style={{ marginTop: '5%' }}>
        {/* عنوان الجدول */}
        <div className="p-6 border-b border-border/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 dark:from-primary/20 dark:via-primary/10 dark:to-accent/20">
          <div className="flex items-center justify-center gap-3">
            {boardColor && (
              <div 
                className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white/20 dark:ring-slate-700/50"
                style={{ backgroundColor: boardColor }}
              />
            )}
            <h3 className="font-bold text-xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {boardTitle || 'مهام القسم'}
            </h3>
            <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 bg-primary/5 dark:bg-primary/10">
              {tasks.length} مهمة
            </Badge>
          </div>
        </div>
        <table className="task-table w-full">
          <tbody>
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm bg-muted/20">
                لا توجد مهام في هذا القسم
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-border/50 bg-card shadow-sm" style={{ marginTop: '5%' }}>
      {/* عنوان الجدول */}
      <div className="p-6 border-b border-border/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 dark:from-primary/20 dark:via-primary/10 dark:to-accent/20">
        <div className="flex items-center justify-center gap-3">
          {boardColor && (
            <div 
              className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white/20 dark:ring-slate-700/50"
              style={{ backgroundColor: boardColor }}
            />
          )}
          <h3 className="font-bold text-xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {boardTitle || 'مهام القسم'}
          </h3>
          <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 bg-primary/5 dark:bg-primary/10">
            {tasks.length} مهمة
          </Badge>
        </div>
      </div>
      <table className="task-table w-full">
        <thead>
          <tr className="bg-gradient-to-l from-primary/5 to-accent/5">
            <th className="w-16 text-center">
              <div className="flex items-center justify-center">
                ✓
              </div>
            </th>
            <th className="min-w-[200px]">العنوان</th>
            <th className="w-32">الحالة</th>
            <th className="w-32">الأولوية</th>
            <th className="w-32">درجة الصعوبة</th>
            <th className="w-40">الاستحقاق</th>
            <th className="w-48">الوسوم</th>
            <th className="w-16 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <tr
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={cn(
                    'transition-all duration-200 hover:bg-gradient-to-l hover:from-primary/5 hover:to-transparent',
                    'border-b border-border/50',
                    task.status === 'completed' && 'completed',
                    snapshot.isDragging && 'shadow-2xl bg-gradient-to-r from-primary/10 to-accent/10 scale-[1.02]'
                  )}
                >
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => onToggleComplete(task.id)}
                        className="scale-150 data-[state=checked]:bg-status-completed data-[state=checked]:border-status-completed"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onToggleComplete(task.id)}
                        className={cn(
                          'font-medium text-right cursor-pointer hover:text-primary transition-colors duration-200 select-text text-base',
                          task.status === 'completed' && 'line-through text-muted-foreground'
                        )}
                      >
                        {task.title}
                      </button>
                      {task.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge className={cn('text-xs', statusColors[task.status])}>
                      {statusLabels[task.status]}
                    </Badge>
                  </td>
                  <td>
                    <Badge className={cn('text-xs', priorityColors[task.priority])}>
                      {priorityLabels[task.priority]}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTaskDifficultyChange) {
                            const difficulties: Task['difficulty'][] = ['easy', 'medium', 'hard', 'expert'];
                            const currentIndex = difficulties.indexOf(task.difficulty || 'medium');
                            const nextIndex = (currentIndex + 1) % difficulties.length;
                            onTaskDifficultyChange(task.id, difficulties[nextIndex]);
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer border border-muted/20 hover:border-primary/30"
                        title="انقر لتغيير درجة الصعوبة"
                      >
                        {(task.difficulty || 'medium') === 'easy' && (
                          <>
                            <span className="text-green-500 text-lg">🌱</span>
                            <span className="text-xs text-green-600 font-medium">سهل</span>
                          </>
                        )}
                        {(task.difficulty || 'medium') === 'medium' && (
                          <>
                            <span className="text-yellow-500 text-lg">⚡</span>
                            <span className="text-xs text-yellow-600 font-medium">متوسط</span>
                          </>
                        )}
                        {(task.difficulty || 'medium') === 'hard' && (
                          <>
                            <span className="text-orange-500 text-lg">🔥</span>
                            <span className="text-xs text-orange-600 font-medium">صعب</span>
                          </>
                        )}
                        {(task.difficulty || 'medium') === 'expert' && (
                          <>
                            <span className="text-red-500 text-lg">💀</span>
                            <span className="text-xs text-red-600 font-medium">خبير</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    {task.dueDate ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {(() => {
                          const dueDateInfo = getDueDateInfo(task.dueDate);
                          return dueDateInfo ? (
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2 py-1 ${dueDateInfo.color} border-current/20`}
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
                  <td>
                    <div className="flex gap-1.5 flex-wrap">
                      {task.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default',
                            getTagClassName(tag, isDark)
                          )}
                          title={tag}
                        >
                          <span className="text-xs">{getTagIcon(tag)}</span>
                          <span className="truncate max-w-[80px]">{tag}</span>
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-muted-foreground/20">
                          <span className="text-xs">🏷️</span>
                          +{task.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
                          <Edit className="h-4 w-4" />
                          تعديل المهمة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(task)} className="gap-2">
                          <Copy className="h-4 w-4" />
                          تكرار المهمة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2">
                            <MoveRight className="h-4 w-4" />
                            نقل إلى قسم
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {boards.map(board => (
                              <DropdownMenuItem
                                key={board.id}
                                onClick={() => onMoveToBoard(task.id, board.id)}
                                disabled={task.boardId === board.id}
                              >
                                {board.title}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'working')}>
                          قيد العمل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'waiting')}>
                          بانتظار
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'frozen')}>
                          مجمّد
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
                          مكتمل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onArchive && (
                          <>
                            <DropdownMenuItem onClick={() => onArchive(task.id)} className="gap-2">
                              <Archive className="h-4 w-4" />
                              أرشفة المهمة
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete(task.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف المهمة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )}
            </Draggable>
          ))}
        </tbody>
      </table>
    </div>
  );
}
