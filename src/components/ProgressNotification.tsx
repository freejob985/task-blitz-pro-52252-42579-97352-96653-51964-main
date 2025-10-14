// مكون إشعار التقدم الجميل
import React from 'react';
import { CheckCircle, Target, Zap, Trophy, Clock } from 'lucide-react';

interface ProgressNotificationProps {
  percentage: number;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export function ProgressNotification({ percentage, message, isVisible, onClose }: ProgressNotificationProps) {
  if (!isVisible) return null;

  const getIcon = () => {
    if (percentage >= 100) return <Trophy className="h-8 w-8 text-yellow-500" />;
    if (percentage >= 70) return <Zap className="h-8 w-8 text-purple-500" />;
    if (percentage >= 50) return <Target className="h-8 w-8 text-blue-500" />;
    return <Clock className="h-8 w-8 text-green-500" />;
  };

  const getColor = () => {
    if (percentage >= 100) return 'from-yellow-400 to-orange-500';
    if (percentage >= 70) return 'from-purple-400 to-pink-500';
    if (percentage >= 50) return 'from-blue-400 to-cyan-500';
    return 'from-green-400 to-emerald-500';
  };

  const getParticles = () => {
    const particleCount = Math.floor(percentage / 10);
    return Array.from({ length: particleCount }, (_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-white rounded-full animate-ping"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* الخلفية المتوهجة */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getColor()} opacity-20 rounded-full blur-xl scale-150 animate-pulse`} />
        
        {/* الإشعار الرئيسي */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-bounce">
          {/* الجسيمات المتحركة */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {getParticles()}
          </div>
          
          {/* المحتوى */}
          <div className="relative z-10 text-center">
            {/* الأيقونة */}
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>
            
            {/* النسبة المئوية */}
            <div className={`text-4xl font-bold bg-gradient-to-r ${getColor()} bg-clip-text text-transparent mb-2`}>
              {percentage}%
            </div>
            
            {/* الرسالة */}
            <p className="text-gray-700 dark:text-gray-300 font-cairo text-lg mb-4">
              {message}
            </p>
            
            {/* شريط التقدم */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className={`h-3 bg-gradient-to-r ${getColor()} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            {/* زر الإغلاق */}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-cairo"
            >
              ممتاز! 🎉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون SVG متحرك للتقدم
export function ProgressSVG({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return '#f59e0b';
    if (percentage >= 70) return '#8b5cf6';
    if (percentage >= 50) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* الخلفية */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* شريط التقدم */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px currentColor)',
          }}
        />
      </svg>
      
      {/* النسبة المئوية في الوسط */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

// مكون الإشعار المدمج
export function FocusProgressNotification({ 
  percentage, 
  message, 
  isVisible, 
  onClose 
}: ProgressNotificationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <ProgressSVG percentage={percentage} size={60} />
          <div className="flex-1">
            <p className="font-cairo font-semibold text-gray-800 dark:text-gray-200">
              {message}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              استمر في التركيز! 💪
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
