import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// حساب الأيام المتبقية أو المتأخرة للمهام
export function getDueDateInfo(dueDate: string | undefined) {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  
  // إزالة الوقت من التواريخ للمقارنة الصحيحة
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { type: 'today', text: 'اليوم', color: 'text-orange-600 bg-orange-100' };
  } else if (diffDays > 0) {
    return { 
      type: 'remaining', 
      text: `باقي ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`, 
      color: 'text-green-600 bg-green-100' 
    };
  } else {
    const overdueDays = Math.abs(diffDays);
    return { 
      type: 'overdue', 
      text: `تأخير ${overdueDays} ${overdueDays === 1 ? 'يوم' : 'أيام'}`, 
      color: 'text-red-600 bg-red-100' 
    };
  }
}
