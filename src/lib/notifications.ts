// نظام إشعارات Chrome
import { playSound } from './sounds';

interface NotificationMilestone {
  percentage: number;
  title: string;
  body: string;
  icon: string;
  badge: string;
}

const MILESTONES: NotificationMilestone[] = [
  {
    percentage: 25,
    title: '🎯 25% من المهام مكتملة!',
    body: 'استمر في التقدم الرائع! لقد أنجزت ربع مهامك',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png'
  },
  {
    percentage: 50,
    title: '🔥 50% من المهام مكتملة!',
    body: 'رائع! وصلت إلى منتصف الطريق',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png'
  },
  {
    percentage: 75,
    title: '⭐ 75% من المهام مكتملة!',
    body: 'ممتاز! أنت قريب جداً من إنهاء كل شيء',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png'
  },
  {
    percentage: 100,
    title: '🎉 100% - جميع المهام مكتملة!',
    body: 'مبروك! لقد أنهيت جميع مهامك بنجاح',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png'
  }
];

// مفتاح لحفظ النسب التي تم إرسال إشعاراتها
const NOTIFIED_MILESTONES_KEY = 'notified_milestones';

// طلب إذن الإشعارات
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('هذا المتصفح لا يدعم الإشعارات');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// الحصول على النسب التي تم إرسال إشعارات لها
function getNotifiedMilestones(): Set<number> {
  const stored = localStorage.getItem(NOTIFIED_MILESTONES_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

// حفظ النسبة المئوية التي تم إرسال إشعار لها
function saveNotifiedMilestone(percentage: number) {
  const notified = getNotifiedMilestones();
  notified.add(percentage);
  localStorage.setItem(NOTIFIED_MILESTONES_KEY, JSON.stringify([...notified]));
}

// إعادة تعيين النسب المُشعَر بها (عند بدء يوم جديد مثلاً)
export function resetNotificationMilestones() {
  localStorage.removeItem(NOTIFIED_MILESTONES_KEY);
}

// حساب نسبة الإكمال وإرسال الإشعارات المناسبة
export async function checkAndNotifyProgress(totalTasks: number, completedTasks: number) {
  if (totalTasks === 0) return;

  // التحقق من الإذن
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // حساب النسبة المئوية
  const percentage = Math.floor((completedTasks / totalTasks) * 100);
  
  // الحصول على النسب التي تم إرسال إشعارات لها
  const notifiedMilestones = getNotifiedMilestones();

  // التحقق من كل milestone
  for (const milestone of MILESTONES) {
    // إذا وصلنا إلى هذه النسبة ولم نُرسل إشعاراً لها بعد
    if (percentage >= milestone.percentage && !notifiedMilestones.has(milestone.percentage)) {
      await sendMilestoneNotification(milestone);
      saveNotifiedMilestone(milestone.percentage);
      
      // تشغيل صوت عند الوصول للـ 100%
      if (milestone.percentage === 100) {
        await playSound('complete');
      }
    }
  }
}

// إرسال إشعار milestone
async function sendMilestoneNotification(milestone: NotificationMilestone) {
  try {
    // إنشاء الإشعار
    const notification = new Notification(milestone.title, {
      body: milestone.body,
      icon: milestone.icon,
      badge: milestone.badge,
      tag: `milestone-${milestone.percentage}`,
      requireInteraction: milestone.percentage === 100, // الإشعار النهائي يبقى حتى يتفاعل المستخدم
      silent: false,
    });

    // عند النقر على الإشعار، التركيز على النافذة
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // إغلاق الإشعار تلقائياً بعد 5 ثواني (ماعدا 100%)
    if (milestone.percentage !== 100) {
      setTimeout(() => notification.close(), 5000);
    }
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
  }
}

// التحقق من حالة الإذن
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// إرسال إشعار اختباري
export async function sendTestNotification() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  const notification = new Notification('🎯 إشعارات مُفعّلة!', {
    body: 'سنرسل لك إشعارات عند إكمال 25% و 50% و 75% و 100% من مهامك',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png',
    tag: 'test-notification',
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  setTimeout(() => notification.close(), 4000);
  return true;
}
