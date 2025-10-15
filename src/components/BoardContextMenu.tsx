// مكون قائمة السياق للأقسام - قابل للاستخدام في جميع أوضاع العرض
import { 
  Edit2, 
  Trash2, 
  Copy, 
  Archive, 
  Star, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Plus,
  Layers,
  FolderPlus,
  Settings
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
import type { Board } from '@/types';

interface BoardContextMenuProps {
  children: React.ReactNode;
  board: Board;
  isFocused?: boolean;
  isCollapsed?: boolean;
  isHidden?: boolean;
  taskCount?: number;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
  onDuplicate: (board: Board) => void;
  onToggleFocus: (boardId: string) => void;
  onToggleCollapse: (boardId: string) => void;
  onToggleVisibility: (boardId: string) => void;
  onAddTask: (boardId: string) => void;
  onBulkAdd: (boardId: string) => void;
  onAddSubBoard: (parentId: string, title: string) => void;
  onToggleFavorite: (boardId: string) => void;
  onArchive: (boardId: string) => void;
  onCopyTasks: (boardId: string) => void;
  className?: string;
}

export function BoardContextMenu({
  children,
  board,
  isFocused = false,
  isCollapsed = false,
  isHidden = false,
  taskCount = 0,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFocus,
  onToggleCollapse,
  onToggleVisibility,
  onAddTask,
  onBulkAdd,
  onAddSubBoard,
  onToggleFavorite,
  onArchive,
  onCopyTasks,
  className = ''
}: BoardContextMenuProps) {
  const isSubBoard = board.parentId;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={className}>
        {children}
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-64">
        <ContextMenuLabel className="font-cairo text-sm font-semibold">
          إجراءات {isSubBoard ? 'القسم الفرعي' : 'القسم'}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        
        {/* إدارة العرض */}
        <ContextMenuItem 
          onClick={() => onToggleFocus(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          {isFocused ? <Minimize2 className="ml-2 h-4 w-4" /> : <Maximize2 className="ml-2 h-4 w-4" />}
          <span>{isFocused ? 'إلغاء التركيز' : 'التركيز على القسم'}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onToggleCollapse(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          {isCollapsed ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronUp className="ml-2 h-4 w-4" />}
          <span>{isCollapsed ? 'إظهار القسم' : 'إخفاء القسم'}</span>
        </ContextMenuItem>
        
        {!isSubBoard && (
          <ContextMenuItem 
            onClick={() => onToggleVisibility(board.id)} 
            className="font-tajawal cursor-pointer"
          >
            {isHidden ? <Eye className="ml-2 h-4 w-4" /> : <EyeOff className="ml-2 h-4 w-4" />}
            <span>{isHidden ? 'إظهار الأقسام الفرعية' : 'إخفاء الأقسام الفرعية'}</span>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {/* إدارة المهام */}
        <ContextMenuItem 
          onClick={() => onAddTask(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          <Plus className="ml-2 h-4 w-4" />
          <span>إضافة مهمة جديدة</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onBulkAdd(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          <Layers className="ml-2 h-4 w-4" />
          <span>إضافة مهام متعددة</span>
        </ContextMenuItem>
        
        {!isSubBoard && (
          <ContextMenuItem 
            onClick={() => {
              const title = prompt('اسم القسم الفرعي:');
              if (title) {
                onAddSubBoard(board.id, title);
              }
            }} 
            className="font-tajawal cursor-pointer"
          >
            <FolderPlus className="ml-2 h-4 w-4" />
            <span>إضافة قسم فرعي</span>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {/* نسخ المهام */}
        <ContextMenuItem 
          onClick={() => onCopyTasks(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          <Copy className="ml-2 h-4 w-4" />
          <span>نسخ جميع المهام ({taskCount})</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* إدارة القسم */}
        <ContextMenuItem 
          onClick={() => onEdit(board)} 
          className="font-tajawal cursor-pointer"
        >
          <Edit2 className="ml-2 h-4 w-4" />
          <span>تعديل القسم</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onDuplicate(board)} 
          className="font-tajawal cursor-pointer"
        >
          <Copy className="ml-2 h-4 w-4" />
          <span>تكرار القسم</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onToggleFavorite(board.id)} 
          className="font-tajawal cursor-pointer"
        >
          <Star className="ml-2 h-4 w-4" />
          <span>إضافة للمفضلة</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* أرشفة وحذف */}
        <ContextMenuItem 
          onClick={() => onArchive(board.id)}
          className="font-tajawal cursor-pointer"
        >
          <Archive className="ml-2 h-4 w-4" />
          <span>أرشفة القسم</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onDelete(board.id)}
          className="font-tajawal cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          <span>حذف القسم</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
