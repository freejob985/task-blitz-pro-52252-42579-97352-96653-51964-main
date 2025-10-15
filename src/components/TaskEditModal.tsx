// مودال تعديل/إضافة مهمة
import { useState, useEffect } from 'react';
import { Save, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import type { Task, Board } from '@/types';

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  boards: Board[];
  defaultBoardId?: string;
  onSave: (task: Partial<Task>) => void;
}

export function TaskEditModal({
  open,
  onOpenChange,
  task,
  boards,
  defaultBoardId,
  onSave,
}: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('waiting');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [boardId, setBoardId] = useState(defaultBoardId || boards[0]?.id || '');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setBoardId(task.boardId);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setTags(task.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('waiting');
      setPriority('medium');
      setBoardId(defaultBoardId || boards[0]?.id || '');
      setDueDate(undefined);
      setTags([]);
    }
  }, [task, defaultBoardId, boards]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      boardId,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      tags,
    };

    if (task) {
      taskData.id = task.id;
    }

    onSave(taskData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        aria-describedby="task-edit-description"
      >
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl">
            {task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
          </DialogTitle>
          <p id="task-edit-description" className="text-sm text-muted-foreground">
            {task ? 'قم بتعديل تفاصيل المهمة المحددة' : 'أضف مهمة جديدة مع تفاصيلها'}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="أدخل عنوان المهمة"
              dir="rtl"
            />
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف المهمة (اختياري)"
              dir="rtl"
              className="min-h-[80px]"
            />
          </div>

          {/* القسم */}
          <div className="space-y-2">
            <Label>القسم</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {boards.map(board => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الحالة والأولوية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Task['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">قيد العمل</SelectItem>
                  <SelectItem value="waiting">بانتظار</SelectItem>
                  <SelectItem value="frozen">مجمّد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* تاريخ الاستحقاق */}
          <div className="space-y-2">
            <Label>تاريخ الاستحقاق</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ar }) : "اختر تاريخ الاستحقاق"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" dir="rtl">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* الوسوم */}
          <div className="space-y-2">
            <Label>الوسوم</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="أضف وسم"
                dir="rtl"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1 px-2 py-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="gap-2">
            <Save className="h-4 w-4" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
