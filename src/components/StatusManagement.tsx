// مكون إدارة الحالات
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface CustomStatus {
  id: string;
  label: string;
  color: string;
}

interface StatusManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusesChange: (statuses: CustomStatus[]) => void;
}

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: 'working', label: 'قيد العمل', color: 'hsl(45 93% 47%)' },
  { id: 'waiting', label: 'بانتظار', color: 'hsl(195 85% 45%)' },
  { id: 'frozen', label: 'مجمّد', color: 'hsl(215 16% 47%)' },
  { id: 'completed', label: 'مكتمل', color: 'hsl(142 71% 45%)' },
];

const PRESET_COLORS = [
  'hsl(195 85% 45%)', // أزرق
  'hsl(142 71% 45%)', // أخضر
  'hsl(45 93% 47%)', // أصفر
  'hsl(0 84% 60%)', // أحمر
  'hsl(270 70% 50%)', // بنفسجي
  'hsl(35 90% 55%)', // برتقالي
  'hsl(215 16% 47%)', // رمادي
  'hsl(330 80% 50%)', // وردي
];

export function StatusManagement({ open, onOpenChange, onStatusesChange }: StatusManagementProps) {
  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    const saved = localStorage.getItem('customStatuses');
    if (saved) {
      setStatuses(JSON.parse(saved));
    } else {
      setStatuses(DEFAULT_STATUSES);
    }
  }, [open]);

  const saveStatuses = (newStatuses: CustomStatus[]) => {
    localStorage.setItem('customStatuses', JSON.stringify(newStatuses));
    setStatuses(newStatuses);
    onStatusesChange(newStatuses);
  };

  const handleAdd = () => {
    if (!label.trim()) return;
    
    const newStatus: CustomStatus = {
      id: `status-${Date.now()}`,
      label: label.trim(),
      color,
    };
    
    saveStatuses([...statuses, newStatus]);
    setLabel('');
    setColor(PRESET_COLORS[0]);
  };

  const handleEdit = (status: CustomStatus) => {
    setEditingStatus(status);
    setLabel(status.label);
    setColor(status.color);
  };

  const handleUpdate = () => {
    if (!editingStatus || !label.trim()) return;
    
    const updated = statuses.map(s => 
      s.id === editingStatus.id 
        ? { ...s, label: label.trim(), color }
        : s
    );
    
    saveStatuses(updated);
    setEditingStatus(null);
    setLabel('');
    setColor(PRESET_COLORS[0]);
  };

  const handleDelete = async (id: string) => {
    // لا يمكن حذف الحالات الافتراضية
    const defaultIds = DEFAULT_STATUSES.map(s => s.id);
    if (defaultIds.includes(id)) {
      Swal.fire('تحذير', 'لا يمكن حذف الحالات الافتراضية', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'حذف الحالة؟',
      text: 'سيتم تحويل جميع المهام بهذه الحالة إلى "بانتظار"',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      saveStatuses(statuses.filter(s => s.id !== id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6" />
            إدارة الحالات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* إضافة/تعديل حالة */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">
              {editingStatus ? 'تعديل الحالة' : 'إضافة حالة جديدة'}
            </h3>
            
            <div className="space-y-2">
              <Label>اسم الحالة</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: قيد المراجعة"
                dir="rtl"
              />
            </div>

            <div className="space-y-3">
              <Label>اللون</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-10 h-10 rounded-full border-4 transition-all hover:scale-110",
                      color === c ? "border-primary scale-110 shadow-lg" : "border-border hover:border-primary/50"
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-border shadow-md"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">اللون المختار</p>
                    <p className="text-xs font-mono bg-background px-2 py-1 rounded">{color}</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customColor" className="text-xs">أو اختر لون مخصص</Label>
                    <div className="flex gap-2">
                      <input
                        id="customColor"
                        type="color"
                        value={color.startsWith('#') ? color : '#3b82f6'}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-10 w-20 rounded cursor-pointer border-2 border-border"
                      />
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="hsl(195 85% 45%)"
                        dir="ltr"
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {editingStatus ? (
                <>
                  <Button onClick={handleUpdate} disabled={!label.trim()} className="flex-1">
                    حفظ التعديل
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingStatus(null);
                      setLabel('');
                      setColor(PRESET_COLORS[0]);
                    }}
                  >
                    إلغاء
                  </Button>
                </>
              ) : (
                <Button onClick={handleAdd} disabled={!label.trim()} className="flex-1">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة حالة
                </Button>
              )}
            </div>
          </div>

          {/* قائمة الحالات */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">الحالات المتاحة</h3>
            <ScrollArea className="h-64 border rounded-lg p-2">
              <div className="space-y-2">
                {statuses.map((status) => {
                  const isDefault = DEFAULT_STATUSES.some(s => s.id === status.id);
                  return (
                    <div
                      key={status.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="font-medium">{status.label}</span>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs">
                            افتراضية
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(status)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(status.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
