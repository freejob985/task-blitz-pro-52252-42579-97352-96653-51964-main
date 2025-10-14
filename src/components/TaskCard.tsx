// مكون بطاقة المهمة
import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Calendar, Tag, Clock, Edit, Copy, Trash2, CheckCircle2, Pause, Clock3, AlertCircle, Archive } from 'lucide-react';
import type { Task } from '@/types';
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
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onArchive: (id: string) => void;
}

export function TaskCard({
  task,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onArchive,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors: Record<Task['status'], string> = {
    working: 'bg-status-working text-white',
    waiting: 'bg-status-waiting text-white',
    frozen: 'bg-status-frozen text-white',
    completed: 'bg-status-completed text-white',
  };

  const statusLabels: Record<Task['status'], string> = {
    working: 'قيد العمل',
    waiting: 'بانتظار',
    frozen: 'مجمّد',
    completed: 'مكتمل',
  };

  const priorityColors: Record<Task['priority'], string> = {
    high: 'bg-priority-high text-white',
    medium: 'bg-priority-medium text-white',
    low: 'bg-priority-low text-white',
  };

  const priorityLabels: Record<Task['priority'], string> = {
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'group bg-card border border-border rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing',
            'transition-all duration-200 hover:shadow-lg',
            snapshot.isDragging && 'shadow-2xl rotate-2',
            task.status === 'completed' && 'opacity-70'
          )}
          style={{
            boxShadow: snapshot.isDragging ? 'var(--shadow-hover)' : 'var(--shadow-card)',
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                'font-cairo font-semibold text-sm flex-1',
                task.status === 'completed' && 'line-through opacity-60'
              )}
            >
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
                    isHovered && 'opacity-100'
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  تعديل المهمة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(task)}>
                  تكرار المهمة
                </DropdownMenuItem>
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
                <DropdownMenuItem onClick={() => onArchive(task.id)}>
                  <Archive className="ml-2 h-4 w-4" />
                  أرشفة المهمة
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  حذف المهمة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={cn('text-xs px-2 py-0.5', statusColors[task.status])}>
              {statusLabels[task.status]}
            </Badge>
            
            <Badge className={cn('text-xs px-2 py-0.5', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </Badge>

            {task.dueDate && (
              <Badge
                variant={isOverdue ? 'destructive' : 'outline'}
                className="text-xs px-2 py-0.5 flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('ar')}
              </Badge>
            )}

            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {task.createdAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-auto">
                <Clock className="h-3 w-3" />
                {new Date(task.createdAt).toLocaleDateString('ar', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      {/* قائمة السياق - Context Menu */}
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="font-cairo">إجراءات المهمة</ContextMenuLabel>
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onEdit(task)} className="font-tajawal cursor-pointer">
          <Edit className="ml-2 h-4 w-4" />
          <span>تعديل المهمة</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onDuplicate(task)} className="font-tajawal cursor-pointer">
          <Copy className="ml-2 h-4 w-4" />
          <span>تكرار المهمة</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        <ContextMenuLabel className="font-cairo text-xs">تغيير الحالة</ContextMenuLabel>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'working')} 
          className="font-tajawal cursor-pointer"
        >
          <AlertCircle className="ml-2 h-4 w-4 text-status-working" />
          <span>قيد العمل</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'waiting')} 
          className="font-tajawal cursor-pointer"
        >
          <Clock3 className="ml-2 h-4 w-4 text-status-waiting" />
          <span>بانتظار</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'frozen')} 
          className="font-tajawal cursor-pointer"
        >
          <Pause className="ml-2 h-4 w-4 text-status-frozen" />
          <span>مجمّد</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'completed')} 
          className="font-tajawal cursor-pointer"
        >
          <CheckCircle2 className="ml-2 h-4 w-4 text-status-completed" />
          <span>مكتمل</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={() => onArchive(task.id)} 
          className="font-tajawal cursor-pointer"
        >
          <Archive className="ml-2 h-4 w-4" />
          <span>أرشفة المهمة</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onDelete(task.id)} 
          className="font-tajawal cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          <span>حذف المهمة</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
      )}
    </Draggable>
  );
}
