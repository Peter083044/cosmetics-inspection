import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadPage() {
  const router = useRouter();
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<'iphone' | 'android' | 'wechat' | 'other'>('other');

  useEffect(() => {
    setAppUrl(window.location.origin);
    const ua = navigator.userAgent.toLowerCase();
    if (/micromessenger/.test(ua) && /wxwork/.test(ua)) {
      setDeviceType('wechat');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('iphone');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">首件核对系统</h1>
          <p className="text-blue-100 mt-2">化妆品生产过程首件核对管理</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Device Guide */}
        {deviceType === 'wechat' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-bold text-amber-800">检测到企业微信/微信浏览器</span>
            </div>
            <p className="text-amber-700 text-sm">
              微信内置浏览器不支持直接安装应用。请点击右上角 <strong>&middot;&middot;&middot;</strong> 菜单，选择<strong>"在浏览器中打开"</strong>，然后按以下步骤安装。
            </p>
          </div>
        )}

        {/* Install Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {deviceType === 'iphone' ? 'iPhone 安装步骤' : 'Android 安装步骤'}
          </h2>

          {deviceType === 'iphone' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <p className="font-medium text-gray-900">点击底部分享按钮</p>
                  <p className="text-sm text-gray-500">Safari 底部的方块+箭头图标</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <p className="font-medium text-gray-900">选择"添加到主屏幕"</p>
                  <p className="text-sm text-gray-500">向上滑动菜单找到此选项</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <p className="font-medium text-gray-900">点击右上角"添加"</p>
                  <p className="text-sm text-gray-500">应用将出现在主屏幕上</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <p className="font-medium text-gray-900">使用 Chrome 浏览器打开</p>
                  <p className="text-sm text-gray-500">确保使用 Google Chrome 浏览器</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <p className="font-medium text-gray-900">点击"安装应用"按钮</p>
                  <p className="text-sm text-gray-500">页面底部会弹出安装提示</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <p className="font-medium text-gray-900">确认安装</p>
                  <p className="text-sm text-gray-500">点击"安装"即可，应用会出现在桌面</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share Link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">分享给同事</h3>
          <p className="text-sm text-gray-500 mb-3">将以下链接通过微信/企业微信发给同事，对方用手机浏览器打开后按同样步骤安装：</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700 truncate border border-gray-200">
              {appUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white active:bg-blue-700'
              }`}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* Alternative: Direct Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">不安装直接使用</h3>
          <p className="text-sm text-gray-500 mb-4">也可以不安装，每次通过浏览器访问以下地址直接使用：</p>
          <a
            href={appUrl}
            className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-lg font-medium active:bg-gray-200"
          >
            打开首件核对系统
          </a>
        </div>

        {/* Back to App */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full text-center text-blue-600 py-3 font-medium"
        >
          返回系统
        </button>
      </div>
    </div>
  );
}
