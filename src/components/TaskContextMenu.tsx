// مكون قائمة السياق للمهام - قابل للاستخدام في جميع أوضاع العرض
import { 
  Edit, 
  Copy, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  Pause,
  Move,
  Star,
  Calendar,
  Tag
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from './ui/context-menu';
import type { Task, Board } from '@/types';

interface TaskContextMenuProps {
  children: React.ReactNode;
  task: Task;
  boards: Board[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onArchive: (taskId: string) => void;
  onMoveToBoard: (taskId: string, boardId: string) => void;
  onToggleFavorite?: (taskId: string) => void;
  onSetDueDate?: (taskId: string, dueDate: string) => void;
  onAddTag?: (taskId: string, tag: string) => void;
  className?: string;
}

export function TaskContextMenu({
  children,
  task,
  boards,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onArchive,
  onMoveToBoard,
  onToggleFavorite,
  onSetDueDate,
  onAddTag,
  className = ''
}: TaskContextMenuProps) {
  const currentBoard = boards.find(b => b.id === task.boardId);
  const otherBoards = boards.filter(b => b.id !== task.boardId);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={className}>
        {children}
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-64">
        <ContextMenuLabel className="font-cairo text-sm font-semibold">
          إجراءات المهمة
        </ContextMenuLabel>
        <ContextMenuSeparator />
        
        {/* الإجراءات الأساسية */}
        <ContextMenuItem 
          onClick={() => onEdit(task)} 
          className="font-tajawal cursor-pointer"
        >
          <Edit className="ml-2 h-4 w-4" />
          <span>تعديل المهمة</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onDuplicate(task)} 
          className="font-tajawal cursor-pointer"
        >
          <Copy className="ml-2 h-4 w-4" />
          <span>تكرار المهمة</span>
        </ContextMenuItem>
        
        {onToggleFavorite && (
          <ContextMenuItem 
            onClick={() => onToggleFavorite(task.id)} 
            className="font-tajawal cursor-pointer"
          >
            <Star className="ml-2 h-4 w-4" />
            <span>إضافة للمفضلة</span>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {/* تغيير الحالة */}
        <ContextMenuLabel className="font-cairo text-xs text-muted-foreground">
          تغيير الحالة
        </ContextMenuLabel>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'waiting')} 
          className="font-tajawal cursor-pointer"
        >
          <Clock3 className="ml-2 h-4 w-4 text-status-waiting" />
          <span>بانتظار</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onStatusChange(task.id, 'working')} 
          className="font-tajawal cursor-pointer"
        >
          <AlertCircle className="ml-2 h-4 w-4 text-status-working" />
          <span>قيد العمل</span>
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
        
        {/* نقل إلى قسم آخر */}
        {otherBoards.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="font-tajawal cursor-pointer">
              <Move className="ml-2 h-4 w-4" />
              <span>نقل إلى قسم</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {otherBoards.map(board => (
                <ContextMenuItem
                  key={board.id}
                  onClick={() => onMoveToBoard(task.id, board.id)}
                  className="font-tajawal cursor-pointer"
                >
                  <div 
                    className="w-3 h-3 rounded-full ml-2"
                    style={{ backgroundColor: board.color || '#3b82f6' }}
                  />
                  <span>{board.title}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        
        {/* إضافة تاريخ استحقاق */}
        {onSetDueDate && (
          <ContextMenuItem 
            onClick={() => {
              const date = prompt('أدخل تاريخ الاستحقاق (YYYY-MM-DD):');
              if (date) {
                onSetDueDate(task.id, date);
              }
            }} 
            className="font-tajawal cursor-pointer"
          >
            <Calendar className="ml-2 h-4 w-4" />
            <span>تعيين تاريخ استحقاق</span>
          </ContextMenuItem>
        )}
        
        {/* إضافة وسم */}
        {onAddTag && (
          <ContextMenuItem 
            onClick={() => {
              const tag = prompt('أدخل الوسم:');
              if (tag) {
                onAddTag(task.id, tag);
              }
            }} 
            className="font-tajawal cursor-pointer"
          >
            <Tag className="ml-2 h-4 w-4" />
            <span>إضافة وسم</span>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {/* أرشفة وحذف */}
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
  );
}
