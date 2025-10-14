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
import { cn } from '@/lib/utils';

interface TaskTableProps {
  tasks: Task[];
  boards: Board[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onToggleComplete: (id: string) => void;
  onMoveToBoard: (taskId: string, boardId: string) => void;
  onArchive?: (taskId: string) => void;
}

export function TaskTable({
  tasks,
  boards,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onToggleComplete,
  onMoveToBoard,
  onArchive,
}: TaskTableProps) {
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
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm bg-muted/20 rounded-lg">
        لا توجد مهام في هذا القسم
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-border/50 bg-card shadow-sm">
      <table className="task-table">
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
                  <td className="text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => onToggleComplete(task.id)}
                        className="scale-125 data-[state=checked]:bg-status-completed data-[state=checked]:border-status-completed"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'font-medium',
                          task.status === 'completed' && 'line-through'
                        )}
                      >
                        {task.title}
                      </span>
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
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('ar', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {task.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                          <Tag className="h-2.5 w-2.5 ml-1" />
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{task.tags.length - 2}
                        </Badge>
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
