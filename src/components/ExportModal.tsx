// مودال التصدير والنسخ
import { useState } from 'react';
import { Download, Copy, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { exportAsText, exportAsJSON, exportAsCSV, copyToClipboard } from '@/lib/export';
import { showToast } from '@/lib/toast';
import type { Board, Task } from '@/types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  tasks: Task[];
  isFiltered?: boolean;
}

export function ExportModal({
  open,
  onOpenChange,
  boards,
  tasks,
  isFiltered = false,
}: ExportModalProps) {
  const [format, setFormat] = useState<'text' | 'json' | 'csv'>('text');
  const [includeDone, setIncludeDone] = useState(true);
  const [filteredOnly, setFilteredOnly] = useState(false);

  const handleCopy = async () => {
    try {
      let content = '';
      
      const options = {
        format,
        includeDone,
        filteredOnly,
        boards,
        tasks,
      };

      switch (format) {
        case 'text':
          content = exportAsText(options);
          break;
        case 'json':
          content = exportAsJSON(options);
          break;
        case 'csv':
          content = exportAsCSV(options);
          break;
      }

      const success = await copyToClipboard(content);
      
      if (success) {
        showToast('✅ تم النسخ إلى الحافظة بنجاح!', 'success');
      } else {
        throw new Error('فشل النسخ');
      }
    } catch (error) {
      console.error('خطأ في النسخ:', error);
      showToast('حدث خطأ أثناء النسخ', 'error');
    }
  };

  const handleDownload = () => {
    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      const options = {
        format,
        includeDone,
        filteredOnly,
        boards,
        tasks,
      };

      switch (format) {
        case 'text':
          content = exportAsText(options);
          filename = 'tasks.md';
          mimeType = 'text/markdown';
          break;
        case 'json':
          content = exportAsJSON(options);
          filename = 'tasks.json';
          mimeType = 'application/json';
          break;
        case 'csv':
          content = exportAsCSV(options);
          filename = 'tasks.csv';
          mimeType = 'text/csv';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('✅ تم تنزيل الملف بنجاح!', 'success');
    } catch (error) {
      console.error('خطأ في التنزيل:', error);
      showToast('حدث خطأ أثناء التنزيل', 'error');
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = totalTasks - completedTasks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg" 
        dir="rtl"
        aria-describedby="export-description"
      >
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <Download className="h-6 w-6" />
            تصدير ونسخ المهام
          </DialogTitle>
          <p id="export-description" className="text-sm text-muted-foreground">
            تصدير المهام إلى ملف JSON أو CSV أو نسخها للحافظة
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* إحصائيات */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">إجمالي</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-status-completed">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">مكتمل</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-status-working">{activeTasks}</div>
              <div className="text-xs text-muted-foreground">نشط</div>
            </div>
          </div>

          {/* اختيار الصيغة */}
          <div className="space-y-2">
            <Label>صيغة التصدير</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={format === 'text' ? 'default' : 'outline'}
                onClick={() => setFormat('text')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">نص</span>
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                onClick={() => setFormat('json')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileJson className="h-5 w-5" />
                <span className="text-xs">JSON</span>
              </Button>
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="flex-col h-auto py-3 gap-1"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-xs">CSV</span>
              </Button>
            </div>
          </div>

          {/* الخيارات */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>تضمين المهام المكتملة</Label>
              <Switch
                checked={includeDone}
                onCheckedChange={setIncludeDone}
              />
            </div>

            {isFiltered && (
              <div className="flex items-center justify-between">
                <Label>المهام المُرشّحة فقط</Label>
                <Switch
                  checked={filteredOnly}
                  onCheckedChange={setFilteredOnly}
                />
              </div>
            )}
          </div>

          {/* معاينة */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            {format === 'text' && (
              <p>سيتم تصدير المهام كنص منسّق (Markdown) مع emoji للحالة والأولوية</p>
            )}
            {format === 'json' && (
              <p>سيتم تصدير البيانات بصيغة JSON الكاملة للاستيراد لاحقاً</p>
            )}
            {format === 'csv' && (
              <p>سيتم تصدير المهام بصيغة CSV للاستخدام في Excel أو جداول البيانات</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button variant="secondary" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            نسخ
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            تنزيل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
