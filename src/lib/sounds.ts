// نظام الأصوات
import { getSettings } from './db';

export type SoundType = 'create' | 'complete' | 'delete' | 'error' | 'start' | 'break' | 'bulk' | 'bulk-add';

// مسارات الأصوات (يمكن استبدالها بملفات محلية)
const SOUNDS: Record<SoundType, string> = {
  create: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PO/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQA==',
  complete: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  delete: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  start: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  break: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  bulk: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
  'bulk-add': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0QV6vn7qhaGQk9ltzzwnAfBSuBzvLaiTYIGmi67uOcTgwKUqnk77BfGwg2jtTyy3UqBBl8zfDdkEAKFF6078yZWxoLQqLi8rdkHgU3kNPxy3krBSJ5y+/el0MJFV+07++qWRoKPZzc8r9pHgU0hdDw1YU1Bxlqv+vklUYOD1Kp5fC0YxwFN4/U8sp1KgQZfM/w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYYaLvt46BOEQ1Nqebxr10cCTWN1/LJeCgFF3vN8N2QQAkUXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw0PUqnl8LdjHAU3j9TyynUqBBl8z/DdkEAKE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0BhlqvuzkkkgOD1Kp5fC1YhwENI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG+axwENobP8tSANAYZar/s5JJHDw9Sqefws2EbBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSTRw4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEAJE12y7+6oWBsJPprc8b9rHAQ2hs/y1IA0Bhlqv+zkkkgOD1Kp5fC0YRwGNI3X8slzKAQXfM3w3ZBACRNdsu/uqFgbCT6a3PG/axwENobP8tSANAYZar/s5JJIDg9SqeXwtGEcBjSN1/LJcygEF3zN8N2QQAkTXbLv7qhYGwk+mtzzv2scBDaGz/LUgDQGGWq/7OSSRQ4PUqnl8LRhHAY0jdfyyXMoBBd8zfDdkEA==',
};

let audioContext: AudioContext | null = null;

// إنشاء Audio Context
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// تشغيل صوت مميز للإكمال
export async function playCompletionSound(): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings?.soundsEnabled) return;

    const ctx = getAudioContext();
    
    // صوت احتفالي متعدد النغمات
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      }, i * 100);
    });
  } catch (error) {
    console.warn('فشل تشغيل صوت الإكمال:', error);
  }
}

// تشغيل صوت
export async function playSound(type: SoundType): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings?.soundsEnabled) return;

    if (type === 'complete') {
      await playCompletionSound();
      return;
    }

    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.warn('فشل تشغيل الصوت:', error);
  }
}

// تشغيل صوت بتردد مخصص (للمؤقت)
export function playBeep(frequency: number = 800, duration: number = 200): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.warn('فشل تشغيل النغمة:', error);
  }
}

// تشغيل صوت خاص لإضافة المهام المتعددة
export async function playBulkAddSound(): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings?.soundsEnabled) return;

    const ctx = getAudioContext();
    
    // نغمة متدرجة للإضافة المتعددة
    const frequencies = [440, 554.37, 659.25, 783.99]; // A4, C#5, E5, G5
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }, i * 80);
    });
  } catch (error) {
    console.warn('فشل تشغيل صوت الإضافة المتعددة:', error);
  }
}
