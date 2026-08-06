'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Inspection {
  id: number;
  inspection_date: string;
  product_name: string;
  product_code: string;
  color_number: string;
  batch_number: string;
  status: string;
  result: string;
  assistant_name: string;
  submit_explanation: string;
  rejected_to: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'status-draft' },
  line_leader_review: { label: '待线长审核', cls: 'status-pending' },
  supervisor_review: { label: '待主管审核', cls: 'status-pending' },
  qc_review: { label: '待QC审核', cls: 'status-pending' },
  approved: { label: '已通过', cls: 'status-approved' },
  rejected: { label: '已驳回', cls: 'status-rejected' },
};

const ROLE_LABELS: Record<string, string> = {
  assistant: '辅助',
  line_leader: '线长',
  supervisor: '主管',
  qc: 'QC',
  admin: '管理员',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    fetchUser();
    fetchInspections();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspections');
      const data = await res.json();
      if (data.success) {
        setInspections(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  // 切换账号功能
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<Array<{username: string; name: string; role: string; password: string}>>([]);

  useEffect(() => {
    // 从 localStorage 读取最近登录的账号
    try {
      const stored = localStorage.getItem('recent-accounts');
      if (stored) {
        setRecentAccounts(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSwitchAccount = async (username: string, password: string) => {
    try {
      // 先登出当前账号
      await fetch('/api/auth', { method: 'DELETE' });
      // 直接用保存的密码登录
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        alert('切换失败，密码可能已更改');
      }
    } catch {
      alert('切换失败');
    }
  };

  const handleChangePassword = async () => {
    setPwdMsg('');
    if (!oldPwd || !newPwd) {
      setPwdMsg('请填写完整');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg('两次密码不一致');
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg('新密码至少6个字符');
      return;
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg('密码修改成功');
        setTimeout(() => {
          setShowPwdModal(false);
          setOldPwd('');
          setNewPwd('');
          setConfirmPwd('');
          setPwdMsg('');
        }, 1500);
      } else {
        setPwdMsg(data.error || '修改失败');
      }
    } catch {
      setPwdMsg('网络错误');
    }
  };

  const filteredInspections = activeTab === 'pending'
    ? inspections.filter(i => i.status !== 'approved' && i.status !== 'rejected')
    : inspections;

  const getStatusInfo = (status: string) => STATUS_MAP[status] || { label: status, cls: 'status-draft' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="title">检验记录</div>
          <div className="sub">化妆品首件核对系统</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {user && (
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
              {user.name} · {ROLE_LABELS[user.role] || user.role}
            </span>
          )}
          <button onClick={() => setShowSwitchModal(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            切换账号
          </button>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            退出
          </button>
          <button onClick={() => setShowPwdModal(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            修改密码
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待处理
        </div>
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部记录
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
        <button className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '14px' }} onClick={() => router.push('/inspection/new')}>
          + 新建检验
        </button>
        {user?.role === 'admin' && (
          <>
            <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => router.push('/admin')}>
              管理
            </button>
            <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => router.push('/admin?tab=export')}>
              导出
            </button>
          </>
        )}
      </div>

      {/* List */}
      <div className="section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : filteredInspections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>暂无检验记录</div>
          </div>
        ) : (
          filteredInspections.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={item.id} className="card" onClick={() => router.push(`/inspection/${item.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#212121' }}>{item.product_name}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{item.inspection_date || item.created_at?.split('T')[0]}</div>
                  </div>
                  <span className={`status-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span className="product-tag tag-blue">{item.product_code}</span>
                  <span className="product-tag tag-orange">{item.color_number}</span>
                  <span className="product-tag tag-gray">{item.batch_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#999' }}>
                  <span>提交人: {item.assistant_name}</span>
                  {item.result && (
                    <span style={{ color: item.result === 'pass' ? '#2e7d32' : '#d32f2f', fontWeight: '500' }}>
                      {item.result === 'pass' ? '✅ 通过' : '❌ 不通过'}
                    </span>
                  )}
                </div>
                {item.rejected_to && item.status !== 'rejected' && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#e65100', background: '#fff3e0', padding: '4px 8px', borderRadius: '4px' }}>
                    ↩️ 已退回给{ROLE_LABELS[item.rejected_to] || item.rejected_to}
                  </div>
                )}
                {item.submit_explanation && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#666', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                    📝 {item.submit_explanation.substring(0, 50)}{item.submit_explanation.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 切换账号弹窗 */}
      {showSwitchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>切换账号</h3>
            {recentAccounts.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>暂无已保存的账号</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {recentAccounts.map((acc: {username: string; name: string; role: string; password: string}, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: acc.username === user?.username ? '#e3f2fd' : '#f8f9fa', borderRadius: '10px', border: acc.username === user?.username ? '1px solid #2196f3' : '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{acc.name || acc.username}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{acc.username} · {ROLE_LABELS[acc.role] || acc.role}</div>
                    </div>
                    {acc.username === user?.username ? (
                      <span style={{ fontSize: '12px', color: '#2196f3', fontWeight: 'bold' }}>当前</span>
                    ) : (
                      <button
                        onClick={async () => {
                          const res = await fetch('/api/auth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: acc.username, password: acc.password }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setUser(data.user);
                            setShowSwitchModal(false);
                            router.refresh();
                          } else {
                            alert(data.error || '切换失败，密码可能已修改');
                          }
                        }}
                        style={{ background: '#2196f3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        切换
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowSwitchModal(false)} style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer' }}>
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>修改密码</h3>
            <input
              type="password"
              placeholder="当前密码"
              value={oldPwd}
              onChange={e => setOldPwd(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}
            />
            <input
              type="password"
              placeholder="新密码（至少6位）"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}
            />
            <input
              type="password"
              placeholder="确认新密码"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}
            />
            {pwdMsg && (
              <div style={{ fontSize: '13px', color: pwdMsg.includes('成功') ? '#10b981' : '#ef4444', marginBottom: '12px' }}>
                {pwdMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowPwdModal(false); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdMsg(''); }}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
