// مكون مؤقت التركيز
import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Bell, BellOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { showToast } from '@/lib/toast';
import { playBeep, playSound } from '@/lib/sounds';
import { saveSession } from '@/lib/db';
import type { FocusSession } from '@/types';
import { cn } from '@/lib/utils';
import { FocusProgressNotification } from './ProgressNotification';

interface FocusTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FocusTimer({ open, onOpenChange }: FocusTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showProgressNotification, setShowProgressNotification] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [notifiedMilestones, setNotifiedMilestones] = useState<Set<number>>(new Set());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<FocusSession | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // طلب إذن الإشعارات
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [notificationsEnabled]);

  // حفظ الحالة في localStorage
  useEffect(() => {
    if (isRunning || isPaused) {
      localStorage.setItem('focusTimer', JSON.stringify({
        minutes,
        seconds,
        isRunning,
        isPaused,
        mode,
        startedAt: sessionRef.current?.startedAt,
      }));
    } else {
      localStorage.removeItem('focusTimer');
    }
  }, [minutes, seconds, isRunning, isPaused, mode]);

  // استعادة الحالة عند التحميل
  useEffect(() => {
    const saved = localStorage.getItem('focusTimer');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMinutes(data.minutes);
        setSeconds(data.seconds);
        setIsRunning(data.isRunning);
        setIsPaused(data.isPaused);
        setMode(data.mode);
      } catch (error) {
        console.error('فشل استعادة حالة المؤقت:', error);
      }
    }
  }, []);

  // المؤقت
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            if (minutes === 0) {
              // انتهى الوقت
              handleTimerComplete();
              return 0;
            }
            setMinutes(m => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, minutes]);

  // Wake Lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (error) {
      console.warn('فشل طلب Wake Lock:', error);
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (error) {
      console.warn('فشل إلغاء Wake Lock:', error);
    }
  };

  const handleStart = async () => {
    if (!isRunning) {
      // جلسة جديدة
      sessionRef.current = {
        id: `session-${Date.now()}`,
        type: mode,
        duration: minutes,
        startedAt: new Date().toISOString(),
        completed: false,
      };
      
      if (soundEnabled) {
        await playSound('start');
      }
      
      showToast(
        mode === 'focus' ? '🎯 بدأت جلسة التركيز!' : '☕ بدأت جلسة الاستراحة!',
        'info'
      );
      
      await requestWakeLock();
    }
    
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    releaseWakeLock();
  };

  const handleResume = async () => {
    setIsPaused(false);
    await requestWakeLock();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setMinutes(mode === 'focus' ? 25 : 5);
    setSeconds(0);
    releaseWakeLock();
    
    if (sessionRef.current) {
      sessionRef.current.completed = false;
      saveSession(sessionRef.current);
      sessionRef.current = null;
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);
    releaseWakeLock();

    // حفظ الجلسة
    if (sessionRef.current) {
      sessionRef.current.endedAt = new Date().toISOString();
      sessionRef.current.completed = true;
      await saveSession(sessionRef.current);
    }

    // تشغيل الصوت
    if (soundEnabled) {
      await playSound(mode === 'focus' ? 'complete' : 'break');
      playBeep(800, 300);
    }

    // إشعار سطح المكتب
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(
        mode === 'focus' ? '✅ انتهت جلسة التركيز!' : '☕ انتهت جلسة الاستراحة!',
        {
          body: mode === 'focus' 
            ? 'أحسنت! حان وقت الاستراحة 🎉'
            : 'عودة للعمل المُركّز! 💪',
          icon: '/favicon.ico',
          tag: 'focus-timer',
        }
      );
    }

    showToast(
      mode === 'focus' ? '✅ انتهت جلسة التركيز! أحسنت!' : '☕ انتهت الاستراحة! عودة للعمل!',
      'success'
    );

    // إعادة ضبط للدورة التالية
    setMode(mode === 'focus' ? 'break' : 'focus');
    setMinutes(mode === 'focus' ? 5 : 25);
    setSeconds(0);
  };

  const formatTime = (m: number, s: number) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSeconds = minutes * 60 + seconds;
  const initialSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((initialSeconds - totalSeconds) / initialSeconds) * 100;

  // التحقق من المعالم وإظهار الإشعارات
  useEffect(() => {
    if (isRunning && !isPaused && mode === 'focus') {
      const milestones = [25, 50, 70, 100];
      const currentProgress = Math.round(progress);
      
      for (const milestone of milestones) {
        if (currentProgress >= milestone && !notifiedMilestones.has(milestone)) {
          const messages = {
            25: 'رائع! لقد وصلت إلى 25% من جلسة التركيز 🎯',
            50: 'ممتاز! نصف الطريق مكتمل! 🚀',
            70: 'رائع جداً! 70% مكتمل، استمر! 💪',
            100: 'مذهل! لقد أكملت جلسة التركيز بنجاح! 🏆'
          };
          
          setProgressMessage(messages[milestone as keyof typeof messages]);
          setShowProgressNotification(true);
          setNotifiedMilestones(prev => new Set([...prev, milestone]));
          
          // إخفاء الإشعار تلقائياً بعد 3 ثوان
          setTimeout(() => {
            setShowProgressNotification(false);
          }, 3000);
          
          break;
        }
      }
    }
  }, [progress, isRunning, isPaused, mode, notifiedMilestones]);

  // إعادة تعيين المعالم عند بدء جلسة جديدة
  useEffect(() => {
    if (isRunning && !isPaused) {
      setNotifiedMilestones(new Set());
    }
  }, [isRunning, isPaused]);

  return (
    <>
      <FocusProgressNotification
        percentage={Math.round(progress)}
        message={progressMessage}
        isVisible={showProgressNotification}
        onClose={() => setShowProgressNotification(false)}
      />
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md" 
          dir="rtl"
          aria-describedby="focus-timer-description"
        >
          <DialogHeader>
            <DialogTitle className="font-cairo text-2xl flex items-center gap-2">
              <Timer className="h-6 w-6" />
              مؤقت التركيز
            </DialogTitle>
            <p id="focus-timer-description" className="text-sm text-muted-foreground">
              استخدم مؤقت بومودورو لتحسين إنتاجيتك
            </p>
          </DialogHeader>

        <div className="space-y-6">
          {/* اختيار النمط */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'focus' ? 'default' : 'outline'}
              onClick={() => {
                setMode('focus');
                setMinutes(25);
                setSeconds(0);
              }}
              disabled={isRunning}
              className="flex-1"
            >
              🎯 تركيز
            </Button>
            <Button
              variant={mode === 'break' ? 'default' : 'outline'}
              onClick={() => {
                setMode('break');
                setMinutes(5);
                setSeconds(0);
              }}
              disabled={isRunning}
              className="flex-1"
            >
              ☕ استراحة
            </Button>
          </div>

          {/* المؤقت */}
          <div className="relative">
            <div className="text-center">
              <div className="text-7xl font-bold font-mono mb-4 text-primary">
                {formatTime(minutes, seconds)}
              </div>
              
              {/* شريط التقدم */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000',
                    mode === 'focus' ? 'bg-primary' : 'bg-secondary'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2 justify-center">
            {!isRunning || isPaused ? (
              <Button
                onClick={isPaused ? handleResume : handleStart}
                size="lg"
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                {isPaused ? 'استئناف' : 'بدء'}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="secondary"
                size="lg"
                className="gap-2"
              >
                <Pause className="h-5 w-5" />
                إيقاف مؤقت
              </Button>
            )}
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              إعادة ضبط
            </Button>
          </div>

          {/* أزرار سريعة */}
          {!isRunning && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinutes(25);
                  setSeconds(0);
                  setMode('focus');
                }}
              >
                25 دقيقة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinutes(5);
                  setSeconds(0);
                  setMode('break');
                }}
              >
                5 دقائق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinutes(50);
                  setSeconds(0);
                  setMode('focus');
                }}
              >
                50 دقيقة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinutes(10);
                  setSeconds(0);
                  setMode('break');
                }}
              >
                10 دقائق
              </Button>
            </div>
          )}

          {/* إدخال مخصص */}
          {!isRunning && (
            <div className="flex gap-2 items-center">
              <Label className="whitespace-nowrap">مدة مخصصة:</Label>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                min={1}
                max={120}
                className="w-20"
              />
              <span>دقيقة</span>
            </div>
          )}

          {/* الإعدادات */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <Label>إشعارات سطح المكتب</Label>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>تشغيل الأصوات</Label>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// مكون Badge صغير للعرض في الرأس
export function FocusTimerBadge({ onClick }: { onClick: () => void }) {
  const [timerData, setTimerData] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('focusTimer');
      if (saved) {
        try {
          setTimerData(JSON.parse(saved));
        } catch (error) {
          setTimerData(null);
        }
      } else {
        setTimerData(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timerData || (!timerData.isRunning && !timerData.isPaused)) {
    return null;
  }

  const formatTime = (m: number, s: number) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Badge
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:opacity-80 transition-opacity gap-2 px-3 py-1',
        timerData.mode === 'focus' ? 'bg-primary' : 'bg-secondary'
      )}
    >
      <Timer className="h-3 w-3" />
      {formatTime(timerData.minutes, timerData.seconds)}
      {timerData.isPaused && ' ⏸️'}
    </Badge>
  );
}
