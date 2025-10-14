// مكون إدارة الأقسام
import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { showToast } from '@/lib/toast';
import type { Board } from '@/types';

interface BoardManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  onAddBoard: (title: string, parentId?: string) => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onToggleCollapse: (boardId: string) => void;
}

export function BoardManager({
  open,
  onOpenChange,
  boards,
  onAddBoard,
  onEditBoard,
  onDeleteBoard,
  onToggleCollapse,
}: BoardManagerProps) {
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const mainBoards = boards.filter(b => !b.parentId);
  const subBoards = boards.filter(b => b.parentId);

  const handleAddBoard = async () => {
    if (!newBoardTitle.trim()) {
      showToast('الرجاء إدخال اسم القسم', 'warning');
      return;
    }

    onAddBoard(newBoardTitle.trim(), selectedParentId || undefined);
    setNewBoardTitle('');
    setSelectedParentId('');
    showToast('تم إضافة القسم بنجاح', 'success');
  };

  const handleEditBoard = async (board: Board) => {
    setEditingBoard(board);
    setEditTitle(board.title);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      showToast('الرجاء إدخال اسم القسم', 'warning');
      return;
    }

    onEditBoard({ ...editingBoard!, title: editTitle.trim() });
    setEditingBoard(null);
    setEditTitle('');
    showToast('تم تحديث القسم بنجاح', 'success');
  };

  const handleDeleteBoard = async (board: Board) => {
    const isMainBoard = !board.parentId;
    const hasSubBoards = subBoards.some(sb => sb.parentId === board.id);
    
    const result = await Swal.fire({
      title: 'حذف القسم؟',
      text: isMainBoard && hasSubBoards 
        ? 'سيتم حذف القسم وجميع الأقسام الفرعية والمهام الموجودة فيه'
        : 'سيتم حذف القسم وجميع المهام الموجودة فيه',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      onDeleteBoard(board.id);
      showToast('تم حذف القسم بنجاح', 'info');
    }
  };

  const getSubBoardsForParent = (parentId: string) => {
    return subBoards.filter(sb => sb.parentId === parentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            إدارة الأقسام ({boards.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* إضافة قسم جديد */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-cairo font-semibold text-lg">إضافة قسم جديد</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم القسم</Label>
                <Input
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="مثال: مشروع جديد"
                  dir="rtl"
                />
              </div>
              
              <div className="space-y-2">
                <Label>القسم الأب (اختياري)</Label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  dir="rtl"
                >
                  <option value="">قسم رئيسي</option>
                  {mainBoards.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button onClick={handleAddBoard} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              إضافة القسم
            </Button>
          </div>

          {/* قائمة الأقسام */}
          <div className="space-y-4">
            <h3 className="font-cairo font-semibold text-lg">الأقسام الموجودة</h3>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {mainBoards.map((board) => {
                  const subBoardsForThis = getSubBoardsForParent(board.id);
                  const hasSubBoards = subBoardsForThis.length > 0;
                  
                  return (
                    <div key={board.id} className="space-y-2">
                      {/* القسم الرئيسي */}
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-cairo font-medium">{board.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              قسم رئيسي
                            </Badge>
                            {hasSubBoards && (
                              <Badge variant="outline" className="text-xs">
                                {subBoardsForThis.length} قسم فرعي
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {hasSubBoards && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => onToggleCollapse(board.id)}
                            >
                              {board.collapsed ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditBoard(board)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteBoard(board)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* الأقسام الفرعية */}
                      {hasSubBoards && !board.collapsed && (
                        <div className="mr-6 space-y-2">
                          {subBoardsForThis.map((subBoard) => (
                            <div key={subBoard.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="w-4 h-4 border-l-2 border-b-2 border-muted-foreground/30 ml-2" />
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-cairo text-sm">{subBoard.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    قسم فرعي
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleEditBoard(subBoard)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteBoard(subBoard.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {mainBoards.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أقسام</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// مودال تعديل القسم
interface EditBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
  onSave: (board: Board) => void;
}

export function EditBoardModal({ open, onOpenChange, board, onSave }: EditBoardModalProps) {
  const [title, setTitle] = useState('');

  React.useEffect(() => {
    if (board) {
      setTitle(board.title);
    }
  }, [board]);

  const handleSave = () => {
    if (!title.trim()) {
      showToast('الرجاء إدخال اسم القسم', 'warning');
      return;
    }

    onSave({ ...board!, title: title.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-xl">تعديل القسم</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>اسم القسم</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اسم القسم"
              dir="rtl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
