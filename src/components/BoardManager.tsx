// مكون إدارة الأقسام المحسن
import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree, GripVertical, ChevronDown, ChevronUp, Palette, Copy, Star, Archive, Settings, Eye, EyeOff, Search, Filter, Grid, List } from 'lucide-react';
import Swal from 'sweetalert2';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { showToast } from '@/lib/toast';
import type { Board } from '@/types';

interface BoardManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  onAddBoard: (boardData: Partial<Board>) => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onToggleCollapse: (boardId: string) => void;
  onDuplicateBoard: (board: Board) => void;
  onArchiveBoard: (boardId: string) => void;
  onToggleFavorite: (boardId: string) => void;
}

const BOARD_TEMPLATES = [
  { id: 'personal', name: 'شخصي', icon: '👤', color: '#3b82f6' },
  { id: 'work', name: 'عمل', icon: '💼', color: '#10b981' },
  { id: 'project', name: 'مشروع', icon: '📋', color: '#f59e0b' },
  { id: 'learning', name: 'تعلم', icon: '📚', color: '#8b5cf6' },
  { id: 'health', name: 'صحة', icon: '🏥', color: '#ef4444' },
  { id: 'finance', name: 'مالية', icon: '💰', color: '#06b6d4' },
  { id: 'travel', name: 'سفر', icon: '✈️', color: '#84cc16' },
  { id: 'hobby', name: 'هواية', icon: '🎨', color: '#ec4899' },
];

const BOARD_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899',
  '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#dc2626', '#0891b2', '#65a30d', '#db2777'
];

export function BoardManager({
  open,
  onOpenChange,
  boards,
  onAddBoard,
  onEditBoard,
  onDeleteBoard,
  onToggleCollapse,
  onDuplicateBoard,
  onArchiveBoard,
  onToggleFavorite,
}: BoardManagerProps) {
  const [newBoard, setNewBoard] = useState<Partial<Board>>({
    title: '',
    description: '',
    color: BOARD_COLORS[0],
    template: 'personal',
    category: 'عام',
    parentId: undefined
  });
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const mainBoards = boards.filter(b => !b.parentId && !b.isArchived);
  const subBoards = boards.filter(b => b.parentId && !b.isArchived);
  const archivedBoards = boards.filter(b => b.isArchived);

  const categories = [...new Set(boards.map(b => b.category).filter(Boolean))];

  const filteredBoards = mainBoards.filter(board => {
    const matchesSearch = !searchQuery || 
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || board.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddBoard = async () => {
    if (!newBoard.title?.trim()) {
      showToast('الرجاء إدخال اسم القسم', 'warning');
      return;
    }

    const boardData: Partial<Board> = {
      ...newBoard,
      id: `board-${Date.now()}`,
      title: newBoard.title.trim(),
      order: boards.length,
      createdAt: new Date().toISOString(),
      isSubBoard: !!newBoard.parentId,
    };

    onAddBoard(boardData);
    setNewBoard({
      title: '',
      description: '',
      color: BOARD_COLORS[0],
      template: 'personal',
      category: 'عام'
    });
    showToast('تم إضافة القسم بنجاح', 'success');
  };

  const handleEditBoard = async (board: Board) => {
    setEditingBoard(board);
  };

  const handleSaveEdit = async () => {
    if (!editingBoard?.title.trim()) {
      showToast('الرجاء إدخال اسم القسم', 'warning');
      return;
    }

    onEditBoard(editingBoard);
    setEditingBoard(null);
    showToast('تم تحديث القسم بنجاح', 'success');
  };

  const handleDeleteBoard = async (board: Board) => {
    const result = await Swal.fire({
      title: 'حذف القسم؟',
      text: `هل أنت متأكد من حذف "${board.title}"؟ سيتم حذف جميع المهام فيه`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      onDeleteBoard(board.id);
      showToast('تم حذف القسم', 'success');
    }
  };

  const handleDuplicateBoard = async (board: Board) => {
    const duplicatedBoard: Board = {
      ...board,
      id: `board-${Date.now()}`,
      title: `${board.title} (نسخة)`,
      createdAt: new Date().toISOString(),
      order: boards.length,
    };
    onAddBoard(duplicatedBoard);
    showToast('تم تكرار القسم', 'success');
  };

  const handleArchiveBoard = async (board: Board) => {
    const result = await Swal.fire({
      title: 'أرشفة القسم؟',
      text: `هل تريد أرشفة "${board.title}"؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'أرشفة',
      cancelButtonText: 'إلغاء',
    });

    if (result.isConfirmed) {
      onArchiveBoard(board.id);
      showToast('تم أرشفة القسم', 'success');
    }
  };

  const BoardCard = ({ board, isSubBoard = false }: { board: Board; isSubBoard?: boolean }) => (
    <div className={`p-4 rounded-lg border bg-card hover:shadow-md transition-all ${isSubBoard ? 'ml-4 border-muted' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color || '#3b82f6' }}
          />
          <div>
            <h3 className="font-semibold text-lg">{board.title}</h3>
            {board.description && (
              <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          {board.collapsed && <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {board.category && (
            <Badge variant="secondary" className="text-xs">
              {board.category}
            </Badge>
          )}
          {board.template && (
            <Badge variant="outline" className="text-xs">
              {BOARD_TEMPLATES.find(t => t.id === board.template)?.icon} {BOARD_TEMPLATES.find(t => t.id === board.template)?.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(board.id)}
            title={board.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Star className={`h-4 w-4 ${board.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleCollapse(board.id)}
            title={board.collapsed ? 'إظهار القسم' : 'إخفاء القسم'}
          >
            {board.collapsed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditBoard(board)}
            title="تعديل"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicateBoard(board)}
            title="تكرار"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleArchiveBoard(board)}
            title="أرشفة"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBoard(board)}
            title="حذف"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            إدارة الأقسام
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">إدارة الأقسام</TabsTrigger>
            <TabsTrigger value="add">إضافة قسم جديد</TabsTrigger>
            <TabsTrigger value="templates">القوالب</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            {/* شريط البحث والتصفية */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الأقسام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* قائمة الأقسام */}
            <ScrollArea className="h-96">
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}>
                {filteredBoards.map(board => (
                  <div key={board.id}>
                    <BoardCard board={board} />
                    {/* الأقسام الفرعية */}
                    {subBoards
                      .filter(sub => sub.parentId === board.id)
                      .map(subBoard => (
                        <BoardCard key={subBoard.id} board={subBoard} isSubBoard />
                      ))}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* الأقسام المؤرشفة */}
            {archivedBoards.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>الأقسام المؤرشفة ({archivedBoards.length})</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-2">
                    {archivedBoards.map(board => (
                      <BoardCard key={board.id} board={board} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">اسم القسم *</Label>
                  <Input
                    id="title"
                    value={newBoard.title || ''}
                    onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                    placeholder="مثال: مشروع تطوير الموقع"
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={newBoard.description || ''}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                    placeholder="وصف مختصر للقسم..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Input
                    id="category"
                    value={newBoard.category || ''}
                    onChange={(e) => setNewBoard({ ...newBoard, category: e.target.value })}
                    placeholder="مثال: عمل، شخصي، مشروع..."
                  />
                </div>
                <div>
                  <Label htmlFor="parentBoard">القسم الرئيسي (اختياري)</Label>
                  <Select 
                    value={newBoard.parentId || 'none'} 
                    onValueChange={(value) => setNewBoard({ ...newBoard, parentId: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم الرئيسي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">قسم رئيسي</SelectItem>
                      {mainBoards.map(board => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>اللون</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {BOARD_COLORS.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newBoard.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewBoard({ ...newBoard, color })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>القالب</Label>
                  <Select value={newBoard.template || 'personal'} onValueChange={(value) => setNewBoard({ ...newBoard, template: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARD_TEMPLATES.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.icon}</span>
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorite"
                    checked={newBoard.isFavorite || false}
                    onCheckedChange={(checked) => setNewBoard({ ...newBoard, isFavorite: checked })}
                  />
                  <Label htmlFor="favorite">إضافة للمفضلة</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddBoard} className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                إضافة القسم
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BOARD_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setNewBoard({
                      ...newBoard,
                      template: template.id,
                      color: template.color,
                      title: template.name,
                    });
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: template.color }}
                    >
                      {template.icon}
                    </div>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    قالب جاهز لـ {template.name.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* نافذة تعديل القسم */}
        {editingBoard && (
          <Dialog open={!!editingBoard} onOpenChange={() => setEditingBoard(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعديل القسم</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">اسم القسم</Label>
                  <Input
                    id="edit-title"
                    value={editingBoard.title}
                    onChange={(e) => setEditingBoard({ ...editingBoard, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    value={editingBoard.description || ''}
                    onChange={(e) => setEditingBoard({ ...editingBoard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>اللون</Label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {BOARD_COLORS.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingBoard.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingBoard({ ...editingBoard, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingBoard(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveEdit}>
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}