// مودال استيراد المهام
import { useState, useRef } from 'react';
import { Upload, FileText, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { parseLinesToTasks, parseCSVToTasks } from '@/lib/bulk';
import { parseJSONTasks } from '../lib/import';
import { saveTasks, saveBoard } from '@/lib/db';
import { showToast } from '@/lib/toast';
import { playBulkAddSound } from '@/lib/sounds';
import type { Board, Task } from '@/types';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  onTasksAdded: () => void;
  onBoardsAdded: () => void;
}

export function ImportModal({
  open,
  onOpenChange,
  boards,
  onTasksAdded,
  onBoardsAdded,
}: ImportModalProps) {
  const [format, setFormat] = useState<'lines' | 'csv' | 'json'>('lines');
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ tasks: Task[]; boards: Board[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      
      // تحديد الصيغة حسب امتداد الملف
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'json') {
        setFormat('json');
      } else if (extension === 'csv') {
        setFormat('csv');
      } else {
        setFormat('lines');
      }
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!text.trim()) {
      setErrors(['الرجاء إدخال نص أو رفع ملف']);
      return;
    }

    try {
      setErrors([]);
      let result: { tasks: Task[]; boards: Board[] } = { tasks: [], boards: [] };

      switch (format) {
        case 'lines':
          result.tasks = parseLinesToTasks(text, { boardId: boards[0]?.id || 'default' });
          break;
        case 'csv':
          result.tasks = parseCSVToTasks(text, { boardId: boards[0]?.id || 'default' });
          break;
        case 'json':
          result = parseJSONTasks(text, boards);
          break;
      }

      setPreview(result);
    } catch (error) {
      setErrors([`خطأ في تحليل البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`]);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      // حفظ الأقسام الجديدة إذا وجدت
      if (preview.boards.length > 0) {
        await Promise.all(preview.boards.map(board => saveBoard(board)));
        onBoardsAdded();
      }

      // حفظ المهام
      if (preview.tasks.length > 0) {
        await saveTasks(preview.tasks);
        await playBulkAddSound();
        showToast(`✅ تم استيراد ${preview.tasks.length} مهمة بنجاح!`, 'success');
        onTasksAdded();
      }

      // إعادة تعيين النموذج
      setText('');
      setPreview(null);
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      console.error('خطأ في الاستيراد:', error);
      showToast('حدث خطأ أثناء الاستيراد', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleText = {
    lines: `تصميم واجهة المستخدم !عالية @2025-12-01 #تصميم #ui
كتابة اختبارات الوحدة !متوسطة #برمجة
مراجعة الكود !منخفضة @2025-11-28 #مراجعة #جودة
إعداد التقرير الشهري`,
    csv: `العنوان,الوصف,الأولوية,الاستحقاق,الوسوم
تصميم واجهة المستخدم,تصميم شاشة تسجيل الدخول,عالية,2025-12-01,تصميم;ui
كتابة اختبارات الوحدة,اختبارات للمكونات الجديدة,متوسطة,,برمجة;اختبار
مراجعة الكود,مراجعة PR رقم 123,منخفضة,2025-11-28,مراجعة;جودة`,
    json: `{
  "boards": [
    {
      "id": "board-1",
      "title": "قائمة المهام",
      "order": 0,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "tasks": [
    {
      "id": "task-1",
      "title": "تصميم واجهة المستخدم",
      "description": "تصميم شاشة تسجيل الدخول",
      "status": "waiting",
      "priority": "high",
      "tags": ["تصميم", "ui"],
      "dueDate": "2025-12-01T00:00:00.000Z",
      "boardId": "board-1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "order": 0
    }
  ]
}`
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        aria-describedby="import-description"
      >
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <Upload className="h-6 w-6" />
            استيراد المهام
          </DialogTitle>
          <p id="import-description" className="text-sm text-muted-foreground">
            استيراد المهام من ملف JSON أو CSV
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* رفع الملف */}
          <div className="space-y-2">
            <Label>رفع ملف</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 ml-2" />
                اختر ملف
              </Button>
            </div>
          </div>

          {/* اختيار الصيغة */}
          <div className="space-y-2">
            <Label>صيغة البيانات</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={format === 'lines' ? 'default' : 'outline'}
                onClick={() => setFormat('lines')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">سطر لكل مهمة</span>
              </Button>
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-xs">CSV</span>
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                onClick={() => setFormat('json')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileJson className="h-5 w-5" />
                <span className="text-xs">JSON</span>
              </Button>
            </div>
          </div>

          {/* إدخال البيانات */}
          <div className="space-y-2">
            <Label>البيانات</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={exampleText[format]}
              className="min-h-[200px] font-mono text-sm"
              dir="ltr"
            />
          </div>

          {/* الأخطاء */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* معاينة */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">معاينة البيانات</span>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                {preview.boards.length > 0 && (
                  <div>
                    <span className="font-semibold">الأقسام الجديدة: </span>
                    <span>{preview.boards.length}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold">المهام: </span>
                  <span>{preview.tasks.length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {preview.tasks.slice(0, 3).map((task, i) => (
                    <div key={i}>• {task.title}</div>
                  ))}
                  {preview.tasks.length > 3 && (
                    <div>... و {preview.tasks.length - 3} مهمة أخرى</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* شرح الصيغة */}
          <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <p className="font-semibold">💡 طريقة الاستخدام:</p>
            {format === 'lines' && (
              <>
                <p>• كل سطر = مهمة واحدة</p>
                <p>• <code className="bg-background px-1 rounded">!عالية</code> أو <code className="bg-background px-1 rounded">!متوسطة</code> أو <code className="bg-background px-1 rounded">!منخفضة</code> = الأولوية</p>
                <p>• <code className="bg-background px-1 rounded">@2025-12-01</code> = تاريخ الاستحقاق</p>
                <p>• <code className="bg-background px-1 rounded">#وسم</code> = وسم (يمكن تكرارها)</p>
              </>
            )}
            {format === 'csv' && (
              <>
                <p>• الصف الأول: رأس الجدول (اختياري)</p>
                <p>• الأعمدة: العنوان,الوصف,الأولوية,الاستحقاق,الوسوم</p>
                <p>• الوسوم مفصولة بفاصلة منقوطة (;)</p>
              </>
            )}
            {format === 'json' && (
              <>
                <p>• صيغة JSON كاملة مع الأقسام والمهام</p>
                <p>• يمكن استيراد أقسام جديدة مع المهام</p>
                <p>• يجب أن تحتوي على مصفوفات "boards" و "tasks"</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button variant="secondary" onClick={handlePreview} disabled={!text.trim()}>
            معاينة
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || isProcessing}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isProcessing ? 'جاري الاستيراد...' : 'استيراد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
