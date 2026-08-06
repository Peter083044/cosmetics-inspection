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
  work_order_image?: string;
  instruction_order_image?: string;
  comparisons: Array<{
    side: number;
    side_name: string;
    standard: string;
    actual: string;
    result: string;
    difference: string;
  }>;
  label_comparisons?: Array<{
    index: number;
    name: string;
    standard: string;
    actual: string;
    result: string;
    difference: string;
  }>;
  label_standard?: string;
  label_actual?: string;
  label_result?: string;
  label_difference?: string;
  result: string;
  result_summary: string;
  submit_explanation: string;
  rejected_to: string;
  status: string;
  assistant_name: string;
  created_at: string;
  submitted_at?: string;
  line_leader_time?: string;
  supervisor_time?: string;
  qc_time?: string;
  current_reviewer_name?: string;
  review_levels?: string[];
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
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

// 格式化时间
function formatTime(timeStr: string | undefined | null): string {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 计算时间差（分钟）
function getTimeDiff(startTime: string | undefined | null, endTime: string | undefined | null): number | null {
  if (!startTime || !endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / 1000 / 60);
}

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<'rejected' | 'returned'>('returned');
  const [submitReason, setSubmitReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState<number | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<{ id: number; name: string; username: string }[]>([]);
  const [showReviewerSelect, setShowReviewerSelect] = useState(false);
  const [pendingAction, setPendingAction] = useState<'submitted' | 'approved' | null>(null);
  const [nextRoleLabel, setNextRoleLabel] = useState('');

  const getCurrentReviewerRole = (insp: Inspection): string => {
    if (insp.status === 'line_leader_review') return 'line_leader';
    if (insp.status === 'supervisor_review') return 'supervisor';
    if (insp.status === 'qc_review') return 'qc';
    return '';
  };

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

  // 获取可审核人员列表
  const fetchAvailableReviewers = async (role: string) => {
    try {
      const res = await fetch(`/api/users?role=${role}`);
      const data = await res.json();
      if (data.success) {
        setAvailableReviewers(data.data || []);
        setShowReviewerSelect(true);
      }
    } catch {
      // ignore
    }
  };

  // 获取下一级审核角色
  const getNextReviewRole = (): string | null => {
    if (!inspection?.review_levels || !Array.isArray(inspection.review_levels)) return null;
    const levels = inspection.review_levels as string[];
    const currentStatus = inspection.status;
    
    if (currentStatus === 'draft' || currentStatus === 'rejected') {
      // 提交审核，找第一个审核级别
      return levels[0] || null;
    }
    
    const currentRoleMap: Record<string, string> = {
      'line_leader_review': 'line_leader',
      'supervisor_review': 'supervisor',
      'qc_review': 'qc',
    };
    const currentRole = currentRoleMap[currentStatus];
    if (!currentRole) return null;
    
    const currentIndex = levels.indexOf(currentRole);
    if (currentIndex === -1 || currentIndex >= levels.length - 1) return null;
    
    return levels[currentIndex + 1];
  };

  // 打开审核人选择
  const openReviewerSelect = () => {
    const nextRole = getNextReviewRole();
    if (!nextRole) {
      alert('无法确定下一级审核人');
      return;
    }
    setNextRoleLabel(ROLE_LABELS[nextRole] || nextRole);
    fetchAvailableReviewers(nextRole);
    setShowReviewerSelect(true);
  };

  // 确认选择审核人并提交
  const confirmSubmitWithReviewer = async () => {
    if (!inspection || !selectedReviewerId) {
      alert('请选择审核人');
      return;
    }
    
    setShowReviewerSelect(false);
    
    if (pendingAction === 'approved') {
      // 执行审核通过操作
      try {
        const res = await fetch(`/api/inspections/${inspection.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approved', reviewer_id: selectedReviewerId })
        });
        const data = await res.json();
        if (data.success) {
          alert('审核通过');
          router.refresh();
        } else {
          alert(data.error || '审核失败');
        }
      } catch (err) {
        console.error('审核失败:', err);
        alert('审核失败');
      }
    } else {
      // 执行提交审核操作
      setShowSubmitModal(true);
    }
  };

  const handleApprove = async () => {
    if (!inspection) return;
    
    // 确定下一级审核角色
    const reviewLevels = inspection.review_levels || ['line_leader', 'supervisor', 'qc'];
    const currentRole = getCurrentReviewerRole(inspection);
    const currentIndex = reviewLevels.indexOf(currentRole);
    const nextRole = currentIndex >= 0 && currentIndex < reviewLevels.length - 1 
      ? reviewLevels[currentIndex + 1] 
      : null;
    
    // 如果有下一级，先显示审核人选择
    if (nextRole) {
      const roleLabel: Record<string, string> = { line_leader: '线长', supervisor: '主管', qc: 'QC' };
      try {
        const res = await fetch(`/api/users?role=${nextRole}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setNextRoleLabel(roleLabel[nextRole] || nextRole);
          setAvailableReviewers(data.data);
          setSelectedReviewerId(data.data[0].id);
          setShowReviewerSelect(true);
          setPendingAction('approved');
          return;
        }
      } catch { /* ignore */ }
    }
    
    // 没有下一级或获取失败，直接审核通过
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

  const openRejectModal = (type: 'rejected' | 'returned') => {
    setRejectType(type);
    setShowRejectModal(true);
  };

  const handleRejectOrReturn = async () => {
    if (!inspection || !rejectReason.trim()) {
      alert('请填写原因');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: rejectType, comment: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(rejectType === 'returned' ? '已退回给上一责任人' : '已驳回');
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

  // 计算通过率（包含标签核对）
  const getPassRate = (): number => {
    if (!inspection) return 100;
    const activeComps = (inspection.comparisons || []).filter(c => c.standard || c.actual);
    const activeLabels = (inspection.label_comparisons || []).filter(lc => lc.standard || lc.actual);
    const totalItems = activeComps.length + activeLabels.length;
    if (totalItems === 0) return 100;
    const passCount = activeComps.filter(c => c.result === 'pass').length + activeLabels.filter(lc => lc.result === 'pass').length;
    return Math.round((passCount / totalItems) * 100);
  };

  // 提交审核（需要检查通过率）
  const handleSubmitForReview = async () => {
    if (!inspection) return;
    const passRate = getPassRate();
    if (passRate < 100 && !submitReason.trim()) {
      setShowSubmitModal(true);
      return;
    }
    // Check if reviewer needs to be selected
    if (!selectedReviewerId) {
      setShowReviewerSelect(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'submitted', 
          submitReason: submitReason || undefined,
          reviewer_id: selectedReviewerId 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('已提交审核');
        setShowSubmitModal(false);
        setShowReviewerSelect(false);
        setSubmitReason('');
        setSelectedReviewerId(null);
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

  // 判断当前用户是否可以审核此记录
  const canReview = (): boolean => {
    if (!user || !inspection) return false;
    if (inspection.status === 'approved') return false;
    // 管理员可以审核任何阶段
    if (user.role === 'admin') return true;
    // 对应角色的审核阶段
    if (user.role === 'line_leader' && inspection.status === 'line_leader_review') return true;
    if (user.role === 'supervisor' && inspection.status === 'supervisor_review') return true;
    if (user.role === 'qc' && inspection.status === 'qc_review') return true;
    return false;
  };

  // 判断当前用户是否可以提交（辅助人员，且状态为draft或rejected）
  const canSubmit = (): boolean => {
    if (!user || !inspection) return false;
    if (user.role !== 'assistant' && user.role !== 'admin') return false;
    if (inspection.status === 'draft' || inspection.status === 'rejected') return true;
    // 被退回到辅助的情况
    if (inspection.rejected_to === 'assistant') return true;
    return false;
  };

  const passRate = getPassRate();
  const workOrderImage = inspection?.work_order_image || inspection?.instruction_order_image;

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

      {/* 当前审核人 */}
      {inspection.current_reviewer_name && inspection.status.includes('_review') && (
        <div style={{ padding: '8px 16px', background: '#e3f2fd', borderRadius: '8px', marginBottom: '12px', fontSize: '14px', color: '#1565c0' }}>
          当前审核人：<strong>{inspection.current_reviewer_name}</strong>
        </div>
      )}

      {/* 退回/驳回提示 */}
      {inspection.status === 'rejected' && (
        <div className="section">
          <div style={{ padding: '12px', background: '#ffebee', borderRadius: '8px', border: '1px solid #ef9a9a' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#c62828', marginBottom: '4px' }}>
              ❌ 检验已被驳回
            </div>
            <div style={{ fontSize: '12px', color: '#b71c1c' }}>
              辅助人员需要修改后重新提交
            </div>
          </div>
        </div>
      )}

      {inspection.rejected_to && inspection.status !== 'rejected' && (
        <div className="section">
          <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffcc80' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#e65100', marginBottom: '4px' }}>
              ↩️ 已退回给{ROLE_LABELS[inspection.rejected_to] || inspection.rejected_to}
            </div>
            <div style={{ fontSize: '12px', color: '#bf360c' }}>
              需要重新编辑后提交
            </div>
          </div>
        </div>
      )}

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
              <div className="info-value">{inspection.assistant_name}</div>
            </div>
          </div>

          {/* 时间线信息 */}
          {(inspection.submitted_at || inspection.line_leader_time || inspection.supervisor_time || inspection.qc_time) && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>📅 审核时间线</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {inspection.submitted_at && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#666', minWidth: '60px' }}>提交时间:</span>
                    <span style={{ color: '#333' }}>{formatTime(inspection.submitted_at)}</span>
                  </div>
                )}
                {inspection.line_leader_time && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#666', minWidth: '60px' }}>线长审核:</span>
                    <span style={{ color: '#333' }}>{formatTime(inspection.line_leader_time)}</span>
                    {inspection.submitted_at && (getTimeDiff(inspection.submitted_at, inspection.line_leader_time) ?? 0) > 5 && (
                      <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '11px' }}>⚠️ 超过5分钟</span>
                    )}
                  </div>
                )}
                {inspection.supervisor_time && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#666', minWidth: '60px' }}>主管审核:</span>
                    <span style={{ color: '#333' }}>{formatTime(inspection.supervisor_time)}</span>
                    {(inspection.line_leader_time || inspection.submitted_at) && (
                      (getTimeDiff(inspection.line_leader_time || inspection.submitted_at, inspection.supervisor_time) ?? 0) > 5 && (
                        <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '11px' }}>⚠️ 超过5分钟</span>
                      )
                    )}
                  </div>
                )}
                {inspection.qc_time && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#666', minWidth: '60px' }}>QC审核:</span>
                    <span style={{ color: '#333' }}>{formatTime(inspection.qc_time)}</span>
                    {(inspection.supervisor_time || inspection.line_leader_time || inspection.submitted_at) && (
                      (getTimeDiff(inspection.supervisor_time || inspection.line_leader_time || inspection.submitted_at, inspection.qc_time) ?? 0) > 5 && (
                        <span style={{ marginLeft: '8px', color: '#f59e0b', fontSize: '11px' }}>⚠️ 超过5分钟</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {workOrderImage && (
            <div style={{ marginTop: '12px' }}>
              <div className="info-label" style={{ marginBottom: '6px' }}>工单/指令单照片</div>
              <div className="photo-preview">
                <img src={workOrderImage} alt="工单" style={{ height: '120px' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Photo Comparison */}
      <div className="section">
        <div className="section-title">📷 照片对比</div>
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

      {/* Label Comparisons */}
      {(inspection.label_comparisons || []).some((lc: any) => lc.standard || lc.actual) && (
        <div className="section">
          <div className="section-title">🏷️ 标签核对</div>
          {(inspection.label_comparisons || [])
            .filter((lc: any) => lc.standard || lc.actual)
            .map((lc: any, idx: number) => (
              <div className="card" key={idx}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{lc.name || `标签${idx + 1}`}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '500' }}>标样标签</div>
                    {lc.standard ? (
                      <img src={lc.standard} alt={`${lc.name || '标签'}标样`} style={{ width: '100%', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>未上传</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: '500' }}>首件标签</div>
                    {lc.actual ? (
                      <img src={lc.actual} alt={`${lc.name || '标签'}首件`} style={{ width: '100%', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>未上传</div>
                    )}
                  </div>
                </div>
                {lc.result && (
                  <div style={{ marginTop: '8px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: lc.result === 'pass' ? '#e8f5e9' : '#ffebee', color: lc.result === 'pass' ? '#2e7d32' : '#d32f2f' }}>
                    {lc.name || `标签${idx + 1}`}：{lc.result === 'pass' ? '通过' : '不通过'}
                  </div>
                )}
                {lc.difference && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#ffebee', borderRadius: '6px', fontSize: '12px', color: '#d32f2f' }}>
                    <strong>差异说明：</strong>{lc.difference}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Section 3: Result */}
      <div className="section">
        <div className="section-title">📊 检验结果</div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{inspection.result === 'pass' ? '✅' : '❌'}</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: inspection.result === 'pass' ? '#2e7d32' : '#d32f2f' }}>
              {inspection.result === 'pass' ? '检验通过' : '检验不通过'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
              通过率：{passRate}%
            </span>
          </div>
          {inspection.result_summary && (
            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>总结：</strong>{inspection.result_summary}
            </div>
          )}
          {inspection.submit_explanation && (
            <div style={{ fontSize: '13px', color: '#e65100', marginTop: '8px', padding: '8px', background: '#fff3e0', borderRadius: '6px' }}>
              <strong>提交说明：</strong>{inspection.submit_explanation}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canReview() && (
        <div style={{ padding: '12px 12px 24px 12px', display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={handleApprove} disabled={actionLoading} style={{ flex: 1 }}>
            {actionLoading ? '处理中...' : '✅ 审核通过'}
          </button>
          <button className="btn-secondary" onClick={() => openRejectModal('returned')} disabled={actionLoading} style={{ flex: 1 }}>
            ↩️ 退回
          </button>
          <button className="btn-danger" onClick={() => openRejectModal('rejected')} disabled={actionLoading} style={{ flex: 1 }}>
            ❌ 驳回
          </button>
        </div>
      )}

      {/* 辅助人员提交按钮 */}
      {canSubmit() && (
        <div style={{ padding: '12px 12px 24px 12px' }}>
          <button className="btn-primary" onClick={() => {
            openReviewerSelect();
          }} disabled={actionLoading} style={{ width: '100%' }}>
            {actionLoading ? '提交中...' : '📤 提交审核'}
          </button>
        </div>
      )}

      {/* Reject/Return Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              {rejectType === 'returned' ? '↩️ 退回原因' : '❌ 驳回原因'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              {rejectType === 'returned'
                ? '退回后，上一责任人需要重新编辑并提交'
                : '驳回后，记录将变为已驳回状态'}
            </div>
            <textarea
              className="input-box"
              placeholder={rejectType === 'returned' ? '请填写退回原因' : '请填写驳回原因'}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} style={{ flex: 1 }}>
                取消
              </button>
              <button
                className={rejectType === 'returned' ? 'btn-secondary' : 'btn-danger'}
                onClick={handleRejectOrReturn}
                disabled={actionLoading || !rejectReason.trim()}
                style={{ flex: 1, background: rejectType === 'returned' ? '#ff9800' : undefined, color: rejectType === 'returned' ? '#fff' : undefined }}
              >
                {actionLoading ? '提交中...' : (rejectType === 'returned' ? '确认退回' : '确认驳回')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Reason Modal (通过率不足100%时) */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>⚠️ 通过率不足100%</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              当前通过率：{passRate}%，请填写提交说明原因
            </div>
            <textarea
              className="input-box"
              placeholder="请填写提交说明原因（必填）"
              value={submitReason}
              onChange={(e) => setSubmitReason(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowSubmitModal(false); setSubmitReason(''); }} style={{ flex: 1 }}>
                取消
              </button>
              <button className="btn-primary" onClick={() => {
                setShowSubmitModal(false);
                openReviewerSelect();
              }} disabled={actionLoading || !submitReason.trim()} style={{ flex: 1 }}>
                {actionLoading ? '提交中...' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 选择审核人弹窗 */}
      {showReviewerSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">选择审核人</h3>
            <p className="text-sm text-gray-600 mb-4">
              请选择下一级审核人员（{getNextReviewRole()}）
            </p>
            {availableReviewers.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">暂无可选审核人</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {availableReviewers.map((reviewer) => (
                  <label
                    key={reviewer.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReviewerId === reviewer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewer"
                      value={reviewer.id}
                      checked={selectedReviewerId === reviewer.id}
                      onChange={() => setSelectedReviewerId(reviewer.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{reviewer.name || reviewer.username}</div>
                      <div className="text-xs text-gray-500">{reviewer.username}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewerSelect(false);
                  setSelectedReviewerId(null);
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowReviewerSelect(false);
                  handleSubmitForReview();
                }}
                disabled={!selectedReviewerId}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
