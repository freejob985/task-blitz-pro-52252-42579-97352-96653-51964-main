import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Shield, 
  Clock,
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // التحقق من تثبيت التطبيق
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // الاستماع لحدث التثبيت
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
      <div className="container mx-auto px-4 py-12">
        {/* الهيدر */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-cairo text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ثبّت تطبيق مهام اليوم
          </h1>
          <p className="font-tajawal text-lg text-muted-foreground max-w-2xl mx-auto">
            احصل على تجربة أفضل بتثبيت التطبيق على جهازك
          </p>
        </div>

        {/* المميزات */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <Card className="hover-scale">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-cairo">فتح سريع</CardTitle>
              <CardDescription className="font-tajawal">
                افتح التطبيق مباشرة من الشاشة الرئيسية بدون متصفح
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="font-cairo">يعمل بدون إنترنت</CardTitle>
              <CardDescription className="font-tajawal">
                استخدم التطبيق في أي وقت حتى بدون اتصال بالإنترنت
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-status-completed/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-status-completed" />
              </div>
              <CardTitle className="font-cairo">آمن وخفيف</CardTitle>
              <CardDescription className="font-tajawal">
                لا يستهلك مساحة كبيرة ويحافظ على خصوصيتك
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* زر التثبيت */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardContent className="pt-6">
              {isInstalled ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-status-completed mx-auto mb-4 animate-scale-in" />
                  <h3 className="font-cairo text-2xl font-bold mb-2">
                    التطبيق مثبّت بنجاح! 🎉
                  </h3>
                  <p className="font-tajawal text-muted-foreground mb-6">
                    يمكنك الآن استخدام التطبيق من الشاشة الرئيسية
                  </p>
                  <Link to="/">
                    <Button size="lg" className="gap-2">
                      <span>ابدأ الاستخدام</span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              ) : deferredPrompt ? (
                <div className="text-center py-8">
                  <Smartphone className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
                  <h3 className="font-cairo text-2xl font-bold mb-2">
                    جاهز للتثبيت!
                  </h3>
                  <p className="font-tajawal text-muted-foreground mb-6">
                    اضغط على الزر أدناه لتثبيت التطبيق على جهازك
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handleInstall}
                    className="gap-2 text-lg px-8"
                  >
                    <Download className="w-5 h-5" />
                    <span>تثبيت التطبيق</span>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-cairo text-xl font-bold mb-2">
                    كيفية التثبيت
                  </h3>
                  <div className="font-tajawal text-muted-foreground space-y-4 max-w-md mx-auto mb-6 text-right">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm">
                        <strong>على iPhone:</strong> اضغط على أيقونة المشاركة <span className="inline-block">📤</span> ثم اختر "إضافة إلى الشاشة الرئيسية"
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-sm">
                        <strong>على Android:</strong> اضغط على القائمة <span className="inline-block">⋮</span> ثم اختر "تثبيت التطبيق"
                      </p>
                    </div>
                  </div>
                  <Link to="/">
                    <Button variant="outline" size="lg" className="gap-2">
                      <span>الرجوع للتطبيق</span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* معلومات إضافية */}
        <div className="text-center mt-12">
          <p className="font-tajawal text-sm text-muted-foreground">
            تطبيق ويب تقدمي (PWA) - يعمل على جميع الأجهزة
          </p>
        </div>
      </div>
    </div>
  );
}