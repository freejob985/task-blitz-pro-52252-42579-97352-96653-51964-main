import { useEffect, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-scale-in">
        {/* الأيقونة الرئيسية المتحركة */}
        <div className="relative">
          {/* الدائرة الخارجية المتحركة */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-white/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          
          {/* الدائرة الداخلية */}
          <div className="relative w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-2xl">
            {/* الأيقونات المتحركة */}
            <div className="relative">
              <CheckCircle2 className="w-16 h-16 text-white animate-[scale-in_0.6s_ease-out]" strokeWidth={2.5} />
              <Zap className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-[bounce_1s_infinite]" />
            </div>
          </div>

          {/* نجوم لامعة */}
          <div className="absolute -top-4 -left-4 w-3 h-3 bg-yellow-300 rounded-full animate-[ping_1.5s_ease-in-out_infinite]" />
          <div className="absolute -bottom-4 -right-4 w-2 h-2 bg-cyan-300 rounded-full animate-[ping_2s_ease-in-out_infinite_0.5s]" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-[ping_1.8s_ease-in-out_infinite_0.3s]" />
        </div>

        {/* النص المتحرك */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-cairo text-4xl font-bold text-white animate-fade-in drop-shadow-lg">
            مهام اليوم
          </h1>
          <p className="font-tajawal text-lg text-white/90 animate-fade-in animation-delay-200">
            نظّم يومك بذكاء
          </p>
        </div>

        {/* شريط التحميل */}
        <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden animate-fade-in animation-delay-300">
          <div className="h-full bg-white rounded-full animate-[slide-in-right_2s_ease-out]" />
        </div>

        {/* نص إضافي */}
        <p className="font-tajawal text-sm text-white/70 animate-fade-in animation-delay-500">
          جارٍ تحميل مهامك...
        </p>
      </div>

      {/* خلفية الجزيئات */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-[float_${3 + (i % 3)}s_ease-in-out_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};