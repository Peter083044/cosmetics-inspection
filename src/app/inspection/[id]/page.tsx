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
  instruction_order_image?: string;
  comparisons: Array<{
    side: number;
    side_name: string;
    standard: string;
    actual: string;
    result: string;
    difference: string;
  }>;
  result: string;
  result_summary: string;
  status: string;
  created_by_name: string;
  created_at: string;
  reviewer_name?: string;
  review_comment?: string;
  reviewed_at?: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

const STATUS_LABELS: Record<string, string> = {
  line_leader_review: '待线长审核',
  supervisor_review: '待主管审核',
  qc_review: '待QC审核',
  approved: '已通过',
  rejected: '已驳回',
};

const ROLE_LABELS: Record<string, string> = {
  assistant: '辅助',
  line_leader: '线长',
  supervisor: '主管',
  qc: 'QC',
  admin: '管理员',
};

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [authRes, inspRes] = await Promise.all([
        fetch('/api/auth'),
        fetch(`/api/inspections?id=${(await params).id}`),
      ]);
      const authData = await authRes.json();
      const inspData = await inspRes.json();

      if (authData.success) setUser(authData.user);
      else router.push('/login');

      if (inspData.success && inspData.data) setInspection(inspData.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!inspection) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('审核通过');
        loadData();
      } else {
        alert(data.error || '操作失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!inspection || !rejectReason) {
      alert('请填写驳回原因');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejected', comment: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('已驳回');
        setShowRejectModal(false);
        setRejectReason('');
        loadData();
      } else {
        alert(data.error || '操作失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setActionLoading(false);
    }
  };

  const canReview = () => {
    if (!user || !inspection) return false;
    if (inspection.status === 'approved' || inspection.status === 'rejected') return false;
    if (user.role === 'line_leader' && inspection.status === 'line_leader_review') return true;
    if (user.role === 'supervisor' && inspection.status === 'supervisor_review') return true;
    if (user.role === 'qc' && inspection.status === 'qc_review') return true;
    if (user.role === 'admin') return true;
    return false;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>加载中...</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>未找到检验记录</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div className="header-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>
          ←
        </button>
        <div className="title" style={{ flex: 1 }}>检验详情</div>
        <span className={`status-badge ${
          inspection.status === 'approved' ? 'status-approved' :
          inspection.status === 'rejected' ? 'status-rejected' : 'status-pending'
        }`}>
          {STATUS_LABELS[inspection.status] || inspection.status}
        </span>
      </div>

      {/* Section 1: Basic Info */}
      <div className="section">
        <div className="section-title">📋 基本信息</div>
        <div className="card">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">检验日期</div>
              <div className="info-value">{inspection.inspection_date || inspection.created_at?.split('T')[0]}</div>
            </div>
            <div className="info-item">
              <div className="info-label">产品名称</div>
              <div className="info-value">{inspection.product_name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">产品代码</div>
              <div className="info-value">{inspection.product_code}</div>
            </div>
            <div className="info-item">
              <div className="info-label">色号</div>
              <div className="info-value">{inspection.color_number}</div>
            </div>
            <div className="info-item">
              <div className="info-label">批号</div>
              <div className="info-value" style={{ color: '#999' }}>{inspection.batch_number} <span style={{ fontSize: '10px' }}>(不参与比对)</span></div>
            </div>
            <div className="info-item">
              <div className="info-label">提交人</div>
              <div className="info-value">{inspection.created_by_name}</div>
            </div>
          </div>

          {inspection.instruction_order_image && (
            <div style={{ marginTop: '12px' }}>
              <div className="info-label" style={{ marginBottom: '6px' }}>工单/指令单照片</div>
              <div className="photo-preview">
                <img src={inspection.instruction_order_image} alt="工单" style={{ height: '120px' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Photo Comparison */}
      <div className="section">
        <div className="section-title"> 照片对比</div>
        {inspection.comparisons.map((comp) => (
          <div key={comp.side} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{comp.side_name}</span>
              <span className={`status-badge ${comp.result === 'pass' ? 'status-approved' : 'status-rejected'}`}>
                {comp.result === 'pass' ? '✅ 通过' : '❌ 不通过'}
              </span>
            </div>

            <div className="comparison-row">
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>标样照片</div>
                {comp.standard && (
                  <div className="photo-preview">
                    <img src={comp.standard} alt="标样" />
                  </div>
                )}
              </div>
              <div className="photo-side">
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>首件照片</div>
                {comp.actual && (
                  <div className="photo-preview">
                    <img src={comp.actual} alt="首件" />
                  </div>
                )}
              </div>
            </div>

            {comp.difference && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#ffebee', borderRadius: '6px', fontSize: '12px', color: '#d32f2f' }}>
                <strong>差异说明：</strong>{comp.difference}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section 3: Result */}
      <div className="section">
        <div className="section-title"> 检验结果</div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{inspection.result === 'pass' ? '✅' : '❌'}</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: inspection.result === 'pass' ? '#2e7d32' : '#d32f2f' }}>
              {inspection.result === 'pass' ? '检验通过' : '检验不通过'}
            </span>
          </div>
          {inspection.result_summary && (
            <div style={{ fontSize: '13px', color: '#666' }}>{inspection.result_summary}</div>
          )}
        </div>
      </div>

      {/* Section 4: Review History */}
      {inspection.reviewer_name && (
        <div className="section">
          <div className="section-title">📝 审核记录</div>
          <div className="card">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">审核人</div>
                <div className="info-value">{inspection.reviewer_name}</div>
              </div>
              {inspection.reviewed_at && (
                <div className="info-item">
                  <div className="info-label">审核时间</div>
                  <div className="info-value">{inspection.reviewed_at?.replace('T', ' ').substring(0, 16)}</div>
                </div>
              )}
            </div>
            {inspection.review_comment && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
                <strong>审核意见：</strong>{inspection.review_comment}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canReview() && (
        <div style={{ padding: '12px 12px 24px 12px', display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={handleApprove} disabled={actionLoading} style={{ flex: 1 }}>
            {actionLoading ? '处理中...' : '✅ 审核通过'}
          </button>
          <button className="btn-danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading} style={{ flex: 1 }}>
            ❌ 驳回
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>驳回原因</div>
            <textarea
              className="input-box"
              placeholder="请填写驳回原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} style={{ flex: 1 }}>
                取消
              </button>
              <button className="btn-danger" onClick={handleReject} disabled={actionLoading} style={{ flex: 1 }}>
                {actionLoading ? '提交中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
