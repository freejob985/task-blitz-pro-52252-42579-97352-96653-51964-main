// مودال إضافة المهام المتعددة
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { parseLinesToTasks, parseCSVToTasks } from '@/lib/bulk';
import { saveTasks } from '@/lib/db';
import { showToast } from '@/lib/toast';
import { playSound, playBulkAddSound } from '@/lib/sounds';
import type { Board, Task } from '@/types';

interface BulkAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  defaultBoardId?: string;
  onTasksAdded: () => void;
}

export function BulkAddModal({
  open,
  onOpenChange,
  boards,
  defaultBoardId,
  onTasksAdded,
}: BulkAddModalProps) {
  const [text, setText] = useState('');
  const [boardId, setBoardId] = useState(defaultBoardId || boards[0]?.id || '');
  const [format, setFormat] = useState<'lines' | 'csv'>('lines');
  const [lastAddedTasks, setLastAddedTasks] = useState<Task[]>([]);

  const handleAdd = async () => {
    if (!text.trim()) {
      showToast('الرجاء إدخال نص المهام', 'warning');
      return;
    }

    if (!boardId) {
      showToast('الرجاء اختيار قسم', 'warning');
      return;
    }

    try {
      // تحليل النص إلى مهام
      const tasks = format === 'csv'
        ? parseCSVToTasks(text, { boardId })
        : parseLinesToTasks(text, { boardId });

      if (tasks.length === 0) {
        showToast('لم يتم العثور على مهام صالحة', 'error');
        return;
      }

      // حفظ المهام
      await saveTasks(tasks);
      setLastAddedTasks(tasks);

      // تشغيل صوت خاص للمهام المتعددة
      await playBulkAddSound();

      // إظهار نتيجة
      showToast(`✅ تم إضافة ${tasks.length} مهمة بنجاح!`, 'success');

      // إعادة تحميل المهام
      onTasksAdded();

      // إغلاق المودال
      onOpenChange(false);
      setText('');

      // عرض خيار التراجع
      const result = await Swal.fire({
        title: 'تم الإضافة بنجاح!',
        text: `تم إضافة ${tasks.length} مهمة`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'حسناً',
        cancelButtonText: 'تراجع عن الإضافة',
        timer: 5000,
        timerProgressBar: true,
      });

      if (result.isDismissed && result.dismiss === 'cancel') {
        await handleUndo();
      }
    } catch (error) {
      console.error('خطأ في إضافة المهام:', error);
      showToast('حدث خطأ أثناء إضافة المهام', 'error');
      await playSound('error');
    }
  };

  const handleUndo = async () => {
    if (lastAddedTasks.length === 0) return;

    try {
      // حذف المهام المضافة
      const { deleteTask } = await import('@/lib/db');
      await Promise.all(lastAddedTasks.map(t => deleteTask(t.id)));

      showToast(`تم التراجع عن إضافة ${lastAddedTasks.length} مهمة`, 'info');
      setLastAddedTasks([]);
      onTasksAdded();
    } catch (error) {
      console.error('خطأ في التراجع:', error);
      showToast('حدث خطأ أثناء التراجع', 'error');
    }
  };

  const exampleText = format === 'lines'
    ? `تصميم واجهة المستخدم !عالية @2025-12-01 #تصميم #ui
كتابة اختبارات الوحدة !متوسطة #برمجة
مراجعة الكود !منخفضة @2025-11-28 #مراجعة #جودة
إعداد التقرير الشهري`
    : `العنوان,الوصف,الأولوية,الاستحقاق,الوسوم
تصميم واجهة المستخدم,تصميم شاشة تسجيل الدخول,عالية,2025-12-01,تصميم;ui
كتابة اختبارات الوحدة,اختبارات للمكونات الجديدة,متوسطة,,برمجة;اختبار
مراجعة الكود,مراجعة PR رقم 123,منخفضة,2025-11-28,مراجعة;جودة`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        aria-describedby="bulk-add-description"
      >
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <Plus className="h-6 w-6" />
            إضافة مهام متعددة
          </DialogTitle>
          <p id="bulk-add-description" className="text-sm text-muted-foreground">
            أضف عدة مهام دفعة واحدة باستخدام النص أو ملف CSV
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* اختيار القسم */}
          <div className="space-y-2">
            <Label>القسم الهدف</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم" />
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

          {/* اختيار الصيغة */}
          <div className="space-y-2">
            <Label>الصيغة</Label>
            <div className="flex gap-2">
              <Button
                variant={format === 'lines' ? 'default' : 'outline'}
                onClick={() => setFormat('lines')}
                className="flex-1"
              >
                سطر لكل مهمة
              </Button>
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="flex-1"
              >
                CSV
              </Button>
            </div>
          </div>

          {/* نص المهام */}
          <div className="space-y-2">
            <Label>المهام</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={exampleText}
              className="min-h-[200px] font-mono text-sm"
              dir="rtl"
            />
          </div>

          {/* شرح الصيغة */}
          <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <p className="font-semibold">💡 طريقة الاستخدام:</p>
            {format === 'lines' ? (
              <>
                <p>• كل سطر = مهمة واحدة</p>
                <p>• <code className="bg-background px-1 rounded">!عالية</code> أو <code className="bg-background px-1 rounded">!متوسطة</code> أو <code className="bg-background px-1 rounded">!منخفضة</code> = الأولوية</p>
                <p>• <code className="bg-background px-1 rounded">@2025-12-01</code> = تاريخ الاستحقاق</p>
                <p>• <code className="bg-background px-1 rounded">#وسم</code> = وسم (يمكن تكرارها)</p>
              </>
            ) : (
              <>
                <p>• الصف الأول: رأس الجدول (اختياري)</p>
                <p>• الأعمدة: العنوان,الوصف,الأولوية,الاستحقاق,الوسوم</p>
                <p>• الوسوم مفصولة بفاصلة منقوطة (;)</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة المهام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
