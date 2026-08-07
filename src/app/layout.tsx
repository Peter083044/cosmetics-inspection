import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import { PWARegister } from '@/components/pwa-register';
import { InstallPrompt } from '@/components/install-prompt';
import { SWUpdatePrompt } from '@/components/sw-update-prompt';
import './globals.css';

export const metadata: Metadata = {
  title: '化妆品首件核对系统',
  description: '化妆品生产过程首件核对管理系统，支持多级审核工作流、照片对比、记录导出',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', type: 'image/png' },
      { url: '/icons/icon-512x512.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '首件核对',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <PWARegister />
        <InstallPrompt />
        <SWUpdatePrompt />
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
