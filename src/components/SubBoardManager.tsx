// إدارة الأقسام الفرعية
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Board } from '@/types';

interface SubBoardManagerProps {
  board: Board;
  allBoards: Board[];
  onAddSubBoard: (parentId: string, title: string) => void;
  onToggleCollapse: (boardId: string) => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function SubBoardManager({ 
  board, 
  allBoards, 
  onAddSubBoard, 
  onToggleCollapse,
  onEditBoard,
  onDeleteBoard 
}: SubBoardManagerProps) {
  const subBoards = allBoards.filter(b => b.parentId === board.id);
  const hasSubBoards = subBoards.length > 0;

  const handleAddSubBoard = async () => {
    const { value } = await Swal.fire({
      title: 'قسم فرعي جديد',
      input: 'text',
      inputPlaceholder: 'اسم القسم الفرعي',
      showCancelButton: true,
      cancelButtonText: 'إلغاء',
      confirmButtonText: 'إضافة',
      inputValidator: (value) => {
        if (!value) {
          return 'يجب إدخال اسم القسم';
        }
      }
    });

    if (value) {
      onAddSubBoard(board.id, value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {hasSubBoards && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onToggleCollapse(board.id)}
          >
            {board.collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAddSubBoard}
          className="gap-2"
          title="إضافة قسم فرعي"
        >
          <Plus className="h-4 w-4" />
          <FolderTree className="h-4 w-4" />
        </Button>
        
        {hasSubBoards && (
          <Badge variant="secondary" className="text-xs">
            {subBoards.length} {subBoards.length === 1 ? 'قسم فرعي' : 'أقسام فرعية'}
          </Badge>
        )}
      </div>
      
      {hasSubBoards && !board.collapsed && (
        <div className="mr-6 space-y-2 border-r-2 border-muted pr-3">
          {subBoards.map((subBoard) => (
            <div key={subBoard.id} className="p-2 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between gap-2">
                <span className="font-cairo text-sm font-medium">{subBoard.title}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onEditBoard(subBoard)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDeleteBoard(subBoard.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
