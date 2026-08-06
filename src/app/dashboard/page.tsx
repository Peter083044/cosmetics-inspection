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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {user && (
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
              {user.name} · {ROLE_LABELS[user.role] || user.role}
            </span>
          )}
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            退出
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
    </div>
  );
}
