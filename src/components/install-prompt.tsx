'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: show iOS guide or open install page
      setShowIOSGuide(true);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Always show install button on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 底部固定安装按钮 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Smartphone className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">下载安装 APP</p>
              <p className="text-xs opacity-90 truncate">体验更佳，支持离线使用</p>
            </div>
          </div>
          <Button
            onClick={handleInstall}
            className="bg-white text-blue-600 hover:bg-blue-50 flex-shrink-0"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" />
            安装
          </Button>
        </div>
      </div>

      {/* iOS 安装指南弹窗 */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">iOS 安装步骤</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>点击浏览器底部的 <strong>分享</strong> 按钮</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>向下滑动找到 <strong>"添加到主屏幕"</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>点击 <strong>"添加"</strong> 完成安装</span>
              </li>
            </ol>
            <Button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-4"
            >
              知道了
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
