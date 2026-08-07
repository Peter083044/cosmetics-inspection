'use client';

import { useEffect, useState } from 'react';

export function SWUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  const handleRefresh = () => {
    // Unregister all service workers and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Force reload
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '12px 16px',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <span style={{ fontSize: '14px' }}>发现新版本，请刷新页面</span>
      <button
        onClick={handleRefresh}
        style={{
          backgroundColor: 'white',
          color: '#ef4444',
          border: 'none',
          padding: '6px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        立即刷新
      </button>
    </div>
  );
}
