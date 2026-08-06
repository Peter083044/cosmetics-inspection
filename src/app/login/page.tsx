'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '16px' }}>
            💄
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '1px' }}>
            化妆品首件核对系统
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
            生产质量管控 · 多级审核流程
          </p>
        </div>

        {/* Login Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#212121', margin: '0 0 24px 0', textAlign: 'center' }}>
            账号登录
          </h2>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '500' }}>
                用户名
              </label>
              <input
                className="input-box"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ padding: '12px 14px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: '500' }}>
                密码
              </label>
              <input
                className="input-box"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '12px 14px', fontSize: '14px' }}
              />
            </div>

            {error && (
              <div style={{ background: '#ffebee', color: '#d32f2f', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* Role Info */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginBottom: '8px' }}>默认测试账号</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
              <div style={{ color: '#666' }}>👤 管理员: admin</div>
              <div style={{ color: '#666' }}>🔑 admin123</div>
              <div style={{ color: '#666' }}>👤 辅助: assistant1</div>
              <div style={{ color: '#666' }}>🔑 pass123</div>
              <div style={{ color: '#666' }}>👤 线长: leader1</div>
              <div style={{ color: '#666' }}>🔑 pass123</div>
              <div style={{ color: '#666' }}>👤 主管: supervisor1</div>
              <div style={{ color: '#666' }}>🔑 pass123</div>
              <div style={{ color: '#666' }}>👤 QC: qc1</div>
              <div style={{ color: '#666' }}>🔑 pass123</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/download" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', textDecoration: 'underline' }}>
            手机安装指南
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          化妆品生产质量管控平台 v1.0
        </div>
      </div>
    </div>
  );
}
