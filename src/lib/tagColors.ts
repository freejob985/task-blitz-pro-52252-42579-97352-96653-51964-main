// نظام ألوان الوسوم الجميل
export interface TagColor {
  background: string;
  text: string;
  border: string;
  hover: string;
}

// ألوان الوسوم المتناسقة والجميلة
export const TAG_COLORS: TagColor[] = [
  // ألوان دافئة
  { background: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', hover: 'hover:bg-red-200' },
  { background: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', hover: 'hover:bg-orange-200' },
  { background: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', hover: 'hover:bg-amber-200' },
  { background: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', hover: 'hover:bg-yellow-200' },
  
  // ألوان باردة
  { background: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', hover: 'hover:bg-green-200' },
  { background: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', hover: 'hover:bg-emerald-200' },
  { background: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', hover: 'hover:bg-teal-200' },
  { background: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', hover: 'hover:bg-cyan-200' },
  
  // ألوان زرقاء
  { background: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', hover: 'hover:bg-blue-200' },
  { background: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', hover: 'hover:bg-indigo-200' },
  { background: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', hover: 'hover:bg-violet-200' },
  { background: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', hover: 'hover:bg-purple-200' },
  
  // ألوان وردية
  { background: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', hover: 'hover:bg-pink-200' },
  { background: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', hover: 'hover:bg-rose-200' },
  
  // ألوان رمادية
  { background: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', hover: 'hover:bg-slate-200' },
  { background: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', hover: 'hover:bg-gray-200' },
  { background: 'bg-zinc-100', text: 'text-zinc-800', border: 'border-zinc-200', hover: 'hover:bg-zinc-200' },
  { background: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200', hover: 'hover:bg-neutral-200' },
  
  // ألوان خاصة
  { background: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200', hover: 'hover:bg-sky-200' },
  { background: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', hover: 'hover:bg-lime-200' },
  { background: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-200' },
];

// ألوان داكنة للوضع الليلي
export const TAG_COLORS_DARK: TagColor[] = [
  // ألوان دافئة داكنة
  { background: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700/50', hover: 'hover:bg-red-900/50' },
  { background: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700/50', hover: 'hover:bg-orange-900/50' },
  { background: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-700/50', hover: 'hover:bg-amber-900/50' },
  { background: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700/50', hover: 'hover:bg-yellow-900/50' },
  
  // ألوان باردة داكنة
  { background: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700/50', hover: 'hover:bg-green-900/50' },
  { background: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-700/50', hover: 'hover:bg-emerald-900/50' },
  { background: 'bg-teal-900/30', text: 'text-teal-300', border: 'border-teal-700/50', hover: 'hover:bg-teal-900/50' },
  { background: 'bg-cyan-900/30', text: 'text-cyan-300', border: 'border-cyan-700/50', hover: 'hover:bg-cyan-900/50' },
  
  // ألوان زرقاء داكنة
  { background: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700/50', hover: 'hover:bg-blue-900/50' },
  { background: 'bg-indigo-900/30', text: 'text-indigo-300', border: 'border-indigo-700/50', hover: 'hover:bg-indigo-900/50' },
  { background: 'bg-violet-900/30', text: 'text-violet-300', border: 'border-violet-700/50', hover: 'hover:bg-violet-900/50' },
  { background: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-700/50', hover: 'hover:bg-purple-900/50' },
  
  // ألوان وردية داكنة
  { background: 'bg-pink-900/30', text: 'text-pink-300', border: 'border-pink-700/50', hover: 'hover:bg-pink-900/50' },
  { background: 'bg-rose-900/30', text: 'text-rose-300', border: 'border-rose-700/50', hover: 'hover:bg-rose-900/50' },
  
  // ألوان رمادية داكنة
  { background: 'bg-slate-900/30', text: 'text-slate-300', border: 'border-slate-700/50', hover: 'hover:bg-slate-900/50' },
  { background: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700/50', hover: 'hover:bg-gray-900/50' },
  { background: 'bg-zinc-900/30', text: 'text-zinc-300', border: 'border-zinc-700/50', hover: 'hover:bg-zinc-900/50' },
  { background: 'bg-neutral-900/30', text: 'text-neutral-300', border: 'border-neutral-700/50', hover: 'hover:bg-neutral-900/50' },
  
  // ألوان خاصة داكنة
  { background: 'bg-sky-900/30', text: 'text-sky-300', border: 'border-sky-700/50', hover: 'hover:bg-sky-900/50' },
  { background: 'bg-lime-900/30', text: 'text-lime-300', border: 'border-lime-700/50', hover: 'hover:bg-lime-900/50' },
  { background: 'bg-fuchsia-900/30', text: 'text-fuchsia-300', border: 'border-fuchsia-700/50', hover: 'hover:bg-fuchsia-900/50' },
];

// دالة للحصول على لون الوسم بناءً على النص
export function getTagColor(tag: string, isDark: boolean = false): TagColor {
  const colors = isDark ? TAG_COLORS_DARK : TAG_COLORS;
  
  // استخدام hash بسيط للحصول على لون ثابت لكل وسم
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // تحويل إلى 32-bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// دالة للحصول على فئة CSS للوسم
export function getTagClassName(tag: string, isDark: boolean = false): string {
  const color = getTagColor(tag, isDark);
  return `${color.background} ${color.text} ${color.border} ${color.hover} border rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200`;
}

// دالة للحصول على أيقونة الوسم بناءً على النص
export function getTagIcon(tag: string): string {
  const tagLower = tag.toLowerCase();
  
  if (tagLower.includes('مهم') || tagLower.includes('urgent')) return '🚨';
  if (tagLower.includes('عمل') || tagLower.includes('work')) return '💼';
  if (tagLower.includes('شخصي') || tagLower.includes('personal')) return '👤';
  if (tagLower.includes('مشروع') || tagLower.includes('project')) return '📁';
  if (tagLower.includes('اجتماع') || tagLower.includes('meeting')) return '🤝';
  if (tagLower.includes('تطوير') || tagLower.includes('dev')) return '💻';
  if (tagLower.includes('تصميم') || tagLower.includes('design')) return '🎨';
  if (tagLower.includes('اختبار') || tagLower.includes('test')) return '🧪';
  if (tagLower.includes('وثائق') || tagLower.includes('doc')) return '📄';
  if (tagLower.includes('مراجعة') || tagLower.includes('review')) return '👀';
  if (tagLower.includes('إصلاح') || tagLower.includes('fix')) return '🔧';
  if (tagLower.includes('تحسين') || tagLower.includes('improve')) return '⚡';
  if (tagLower.includes('بحث') || tagLower.includes('research')) return '🔍';
  if (tagLower.includes('تعلم') || tagLower.includes('learn')) return '📚';
  if (tagLower.includes('صحة') || tagLower.includes('health')) return '🏥';
  if (tagLower.includes('رياضة') || tagLower.includes('sport')) return '🏃';
  if (tagLower.includes('سفر') || tagLower.includes('travel')) return '✈️';
  if (tagLower.includes('طعام') || tagLower.includes('food')) return '🍽️';
  if (tagLower.includes('تسوق') || tagLower.includes('shop')) return '🛒';
  if (tagLower.includes('مال') || tagLower.includes('money')) return '💰';
  
  // أيقونات افتراضية بناءً على الحرف الأول
  const firstChar = tag.charAt(0).toLowerCase();
  if (firstChar === 'أ' || firstChar === 'ا' || firstChar === 'a') return '🔤';
  if (firstChar === 'ب' || firstChar === 'b') return '📝';
  if (firstChar === 'ت' || firstChar === 'c') return '📋';
  if (firstChar === 'ث' || firstChar === 'd') return '📊';
  if (firstChar === 'ج' || firstChar === 'e') return '📈';
  if (firstChar === 'ح' || firstChar === 'f') return '📉';
  if (firstChar === 'خ' || firstChar === 'g') return '📌';
  if (firstChar === 'د' || firstChar === 'h') return '📍';
  if (firstChar === 'ذ' || firstChar === 'i') return '🔗';
  if (firstChar === 'ر' || firstChar === 'j') return '🔖';
  if (firstChar === 'ز' || firstChar === 'k') return '🏷️';
  if (firstChar === 'س' || firstChar === 'l') return '⭐';
  if (firstChar === 'ش' || firstChar === 'm') return '🌟';
  if (firstChar === 'ص' || firstChar === 'n') return '✨';
  if (firstChar === 'ض' || firstChar === 'o') return '💫';
  if (firstChar === 'ط' || firstChar === 'p') return '🔥';
  if (firstChar === 'ظ' || firstChar === 'q') return '💎';
  if (firstChar === 'ع' || firstChar === 'r') return '🎯';
  if (firstChar === 'غ' || firstChar === 's') return '🎪';
  if (firstChar === 'ف' || firstChar === 't') return '🎨';
  if (firstChar === 'ق' || firstChar === 'u') return '🎭';
  if (firstChar === 'ك' || firstChar === 'v') return '🎪';
  if (firstChar === 'ل' || firstChar === 'w') return '🎪';
  if (firstChar === 'م' || firstChar === 'x') return '🎪';
  if (firstChar === 'ن' || firstChar === 'y') return '🎪';
  if (firstChar === 'ه' || firstChar === 'z') return '🎪';
  
  return '🏷️'; // أيقونة افتراضية
}
