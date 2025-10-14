// مكتبة التوست باستخدام Toastify
import Toastify from 'toastify-js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info'): void {
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'bottom',
    position: 'left',
    className: `toast-${type}`,
    stopOnFocus: true,
    style: {
      borderRadius: '12px',
      fontFamily: 'Tajawal, sans-serif',
      fontSize: '14px',
      padding: '12px 20px',
    },
  }).showToast();
}
