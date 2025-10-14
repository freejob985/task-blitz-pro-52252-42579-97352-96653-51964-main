// مودال عرض المهام المؤرشفة
import { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, Copy, Calendar, RotateCcw as RestoreAll, Trash2 as DeleteAll } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { getArchivedTasks, unarchiveTask, deleteTask } from '@/lib/db';
import { showToast } from '@/lib/toast';
import { getTagClassName, getTagIcon } from '@/lib/tagColors';
import { cn } from '@/lib/utils';
import type { Task, Board } from '@/types';

interface ArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  onTaskRestored: () => void;
  onTaskDeleted: () => void;
}

const statusLabels: Record<Task['status'], string> = {
  working: 'قيد العمل',
  waiting: 'بانتظار',
  frozen: 'مجمّد',
  completed: 'مكتمل',
};

const priorityLabels: Record<Task['priority'], { label: string; color: string }> = {
  high: { label: 'عالية', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  medium: { label: 'متوسطة', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  low: { label: 'منخفضة', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
};

export function ArchiveModal({ open, onOpenChange, boards, onTaskRestored, onTaskDeleted }: ArchiveModalProps) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // التحقق من الوضع الليلي
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (open) {
      loadArchivedTasks();
    }
  }, [open]);

  const loadArchivedTasks = async () => {
    const tasks = await getArchivedTasks();
    setArchivedTasks(tasks.sort((a, b) => 
      new Date(b.archivedAt || b.createdAt).getTime() - new Date(a.archivedAt || a.createdAt).getTime()
    ));
  };

  const handleRestore = async (taskId: string) => {
    try {
      await unarchiveTask(taskId);
      showToast('تم استعادة المهمة من الأرشيف', 'success');
      loadArchivedTasks();
      onTaskRestored();
    } catch (error) {
      console.error('خطأ في استعادة المهمة:', error);
      showToast('حدث خطأ أثناء استعادة المهمة', 'error');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      showToast('تم حذف المهمة نهائياً', 'info');
      loadArchivedTasks();
      onTaskDeleted();
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error);
      showToast('حدث خطأ أثناء حذف المهمة', 'error');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTasks.size === 0) {
      showToast('الرجاء اختيار مهام للاستعادة', 'warning');
      return;
    }

    try {
      await Promise.all(Array.from(selectedTasks).map(taskId => unarchiveTask(taskId)));
      showToast(`تم استعادة ${selectedTasks.size} مهمة من الأرشيف`, 'success');
      setSelectedTasks(new Set());
      loadArchivedTasks();
      onTaskRestored();
    } catch (error) {
      console.error('خطأ في استعادة المهام:', error);
      showToast('حدث خطأ أثناء استعادة المهام', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      showToast('الرجاء اختيار مهام للحذف', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'حذف المهام المحددة؟',
      text: `سيتم حذف ${selectedTasks.size} مهمة نهائياً`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(Array.from(selectedTasks).map(taskId => deleteTask(taskId)));
        showToast(`تم حذف ${selectedTasks.size} مهمة نهائياً`, 'info');
        setSelectedTasks(new Set());
        loadArchivedTasks();
        onTaskDeleted();
      } catch (error) {
        console.error('خطأ في حذف المهام:', error);
        showToast('حدث خطأ أثناء حذف المهام', 'error');
      }
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === archivedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(archivedTasks.map(t => t.id)));
    }
  };

  const handleCopyToClipboard = async (task: Task) => {
    const board = boards.find(b => b.id === task.boardId);
    const text = `المهمة: ${task.title}
القسم: ${board?.title || 'غير محدد'}
الحالة: ${statusLabels[task.status]}
الأولوية: ${priorityLabels[task.priority].label}
${task.description ? `الوصف: ${task.description}\n` : ''}${task.tags.length > 0 ? `الوسوم: ${task.tags.join(', ')}\n` : ''}${task.dueDate ? `تاريخ الاستحقاق: ${format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ar })}\n` : ''}تم الأرشفة: ${task.archivedAt ? format(new Date(task.archivedAt), 'dd/MM/yyyy HH:mm', { locale: ar }) : 'غير محدد'}`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('تم نسخ المهمة إلى الحافظة', 'success');
    } catch (error) {
      showToast('فشل نسخ المهمة', 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <Archive className="h-6 w-6" />
            الأرشيف ({archivedTasks.length})
          </DialogTitle>
          
          {archivedTasks.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2"
              >
                {selectedTasks.size === archivedTasks.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
              
              {selectedTasks.size > 0 && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkRestore}
                    className="gap-2"
                  >
                    <RestoreAll className="h-4 w-4" />
                    استعادة المحدد ({selectedTasks.size})
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <DeleteAll className="h-4 w-4" />
                    حذف المحدد ({selectedTasks.size})
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {archivedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-cairo">لا توجد مهام مؤرشفة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedTasks.map((task) => {
                const board = boards.find(b => b.id === task.boardId);
                const priorityStyle = priorityLabels[task.priority];
                
                return (
                  <div 
                    key={task.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow bg-card ${
                      selectedTasks.has(task.id) ? 'ring-2 ring-primary/30 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTasks.has(task.id)}
                          onCheckedChange={() => handleSelectTask(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <h3 className="font-cairo font-semibold text-lg">{task.title}</h3>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="outline">{board?.title || 'غير محدد'}</Badge>
                          <Badge variant="outline">{statusLabels[task.status]}</Badge>
                          <Badge className={priorityStyle.color}>
                            {priorityStyle.label}
                          </Badge>
                          
                          {task.dueDate && (
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ar })}
                            </Badge>
                          )}
                          
                          {task.archivedAt && (
                            <span className="text-xs text-muted-foreground">
                              تم الأرشفة: {format(new Date(task.archivedAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            </span>
                          )}
                        </div>
                        
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {task.tags.map((tag, i) => (
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
                          </div>
                        )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyToClipboard(task)}
                          title="نسخ إلى الحافظة"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRestore(task.id)}
                          title="استعادة من الأرشيف"
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(task.id)}
                          title="حذف نهائي"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
