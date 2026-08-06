'use client';

import { useState, useEffect } from 'react';

export default function InstallPage() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'wechat' | 'unknown'>('unknown');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isWeChat = /micromessenger/.test(ua) || /wxwork/.test(ua);
    const isWeChatWork = /wxwork/.test(ua);

    if (isWeChatWork) {
      setPlatform('wechat');
    } else if (isWeChat) {
      setPlatform('wechat');
    } else if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    }
  }, []);

  const appUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">化妆品首件核对系统</h1>
          <p className="text-gray-500 mt-2">安装到手机，像 APP 一样使用</p>
        </div>

        {/* iOS Guide */}
        {platform === 'ios' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              iPhone / iPad 安装步骤
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">1</span>
                <div>
                  <p className="text-gray-700">点击 Safari 底部菜单栏的 <strong>分享按钮</strong></p>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 flex justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L12 15M12 2L8 6M12 2L16 6M5 12V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    <span className="ml-2 text-sm text-gray-500">↑ 此按钮</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">2</span>
                <p className="text-gray-700">向下滑动，找到并点击 <strong>"添加到主屏幕"</strong></p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">3</span>
                <p className="text-gray-700">点击右上角 <strong>"添加"</strong> 确认</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">安装完成后，桌面会出现"首件核对"图标，点击即可像 APP 一样使用。</p>
            </div>
          </div>
        )}

        {/* Android Guide */}
        {platform === 'android' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Android 安装步骤
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">1</span>
                <p className="text-gray-700">使用 <strong>Chrome 浏览器</strong> 打开本页面</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">2</span>
                <div>
                  <p className="text-gray-700">点击浏览器右上角 <strong>菜单按钮（⋮）</strong></p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">3</span>
                <p className="text-gray-700">点击 <strong>"安装应用"</strong> 或 <strong>"添加到主屏幕"</strong></p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">4</span>
                <p className="text-gray-700">在弹窗中点击 <strong>"安装"</strong> 确认</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">安装完成后，桌面会出现"首件核对"图标，点击即可像 APP 一样使用。</p>
            </div>
          </div>
        )}

        {/* WeChat / WeChat Work Guide */}
        {platform === 'wechat' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">!</span>
              企业微信 / 微信内打开
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800 font-medium mb-2">企业微信内无法直接安装 PWA</p>
                <p className="text-sm text-yellow-700">请按以下方式操作：</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">1</span>
                <p className="text-gray-700">点击右上角 <strong>"..."</strong> 菜单</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">2</span>
                <p className="text-gray-700">选择 <strong>"在浏览器中打开"</strong></p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">3</span>
                <p className="text-gray-700">在浏览器中按照上方步骤安装到桌面</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">企业微信集成方案：</p>
              <p className="text-sm text-blue-600">联系管理员在企业微信后台创建"自建应用"，将本系统地址配置为应用主页，员工可直接从企业微信工作台访问，无需安装。</p>
            </div>
          </div>
        )}

        {/* Unknown platform */}
        {platform === 'unknown' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">安装到手机</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">iPhone / iPad:</p>
                <p className="text-sm text-blue-600">Safari → 分享按钮 → 添加到主屏幕</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Android:</p>
                <p className="text-sm text-blue-600">Chrome → 菜单(⋮) → 安装应用 / 添加到主屏幕</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">企业微信:</p>
                <p className="text-sm text-green-600">建议管理员在企业微信后台创建自建应用，员工从工作台直接访问</p>
              </div>
            </div>
          </div>
        )}

        {/* Direct Link */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-3">分享链接</h3>
          <p className="text-sm text-gray-500 mb-2">复制以下链接发送给同事，对方打开后即可安装：</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={appUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(appUrl);
                alert('链接已复制');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium active:bg-blue-600"
            >
              复制
            </button>
          </div>
        </div>

        {/* Enterprise WeChat Integration Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
          <h3 className="font-bold text-gray-900 mb-3">企业微信集成指南</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-medium text-gray-900">管理员操作步骤：</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>登录 <strong>企业微信管理后台</strong>（work.weixin.qq.com）</li>
              <li>进入 <strong>应用管理</strong> → <strong>自建</strong> → <strong>创建应用</strong></li>
              <li>填写应用名称（如"首件核对"），设置可见范围</li>
              <li>在"应用主页"中填入本系统地址</li>
              <li>保存后，员工可在企业微信 <strong>工作台</strong> 中直接访问</li>
            </ol>
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700">优势：无需安装，直接在工作台点击使用；支持统一身份管理；可设置权限范围。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
