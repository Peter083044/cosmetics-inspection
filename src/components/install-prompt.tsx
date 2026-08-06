'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as PWA (iOS)
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect mobile
    const ua = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(mobile);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt on mobile after 2 seconds if not previously dismissed
    const dismissedTime = localStorage.getItem('install-prompt-dismissed');
    if (!dismissedTime || (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60) >= 24) {
      if (mobile) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    // Case 1: Android/Chrome with beforeinstallprompt support
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
      return;
    }

    // Case 2: iOS Safari - show manual guide
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Case 3: Fallback - redirect to install guide page
    // This covers: WeChat browser, other browsers without PWA support
    window.location.href = '/install';
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Install Prompt Banner - only show on mobile */}
      {showPrompt && isMobile && !showIOSGuide && (
        <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-blue-200 bg-blue-50 max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm">
                  安装到桌面
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {isIOS
                    ? '点击安装按钮查看 Safari 安装指南'
                    : '安装应用后获得原生 APP 体验，支持离线使用'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    安装
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { window.location.href = '/install'; }}
                    className="text-blue-600 border-blue-200 text-xs"
                  >
                    安装指南
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-gray-500 text-xs"
                  >
                    稍后
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <Card className="w-full max-w-md rounded-b-none border-t-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  安装到主屏幕
                </h3>
                <button onClick={handleDismiss} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">1</span>
                  <p>点击 Safari 浏览器底部的分享按钮 <span className="inline-block px-1 bg-gray-100 rounded text-xs">⬆️</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">2</span>
                  <p>向下滑动，点击"添加到主屏幕" <span className="inline-block px-1 bg-gray-100 rounded text-xs">+</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">3</span>
                  <p>点击右上角"添加"确认</p>
                </div>
              </div>
              <Button
                onClick={handleDismiss}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
              >
                我知道了
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
