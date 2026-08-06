'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface CurrentUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  assistant: '辅助',
  line_leader: '线长',
  supervisor: '主管',
  qc: 'QC',
  admin: '管理员',
};

const ROLE_COLORS: Record<string, string> = {
  assistant: '#2196F3',
  line_leader: '#FF9800',
  supervisor: '#9C27B0',
  qc: '#4CAF50',
  admin: '#F44336',
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'personnel' | 'records' | 'export'>('personnel');
  const [loading, setLoading] = useState(true);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('assistant');

  // Batch create
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchRole, setBatchRole] = useState('assistant');
  const [batchCount, setBatchCount] = useState(10);
  const [batchPassword, setBatchPassword] = useState('pass123');

  // Edit user
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('assistant');
  const [editPassword, setEditPassword] = useState('');
  const [editMsg, setEditMsg] = useState('');

  // Export
  const [exportType, setExportType] = useState<'csv' | 'excel'>('csv');
  const [exportStatus, setExportStatus] = useState('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [authRes, usersRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/users'),
      ]);
      const authData = await authRes.json();
      const usersData = await usersRes.json();

      if (authData.success) {
        setUser(authData.user);
        if (authData.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/login');
        return;
      }

      if (usersData.success) setUsers(usersData.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUsername || !newName || !newPassword) {
      alert('请填写完整信息');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, name: newName, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        alert('用户添加成功');
        setShowAddForm(false);
        setNewUsername('');
        setNewName('');
        setNewPassword('');
        loadData();
      } else {
        alert(data.error || '添加失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定删除该用户？')) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('删除成功');
        loadData();
      } else {
        alert(data.error || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPassword('');
    setEditMsg('');
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          username: editUsername,
          name: editName,
          role: editRole,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditMsg('修改成功');
        loadData();
        setTimeout(() => { setEditingUser(null); setEditMsg(''); }, 1000);
      } else {
        setEditMsg(data.error || '修改失败');
      }
    } catch {
      setEditMsg('网络错误');
    }
  };

  const handleBatchCreate = async () => {
    if (batchCount < 1 || batchCount > 100) {
      alert('数量必须在1-100之间');
      return;
    }
    try {
      const res = await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: batchRole, count: batchCount, password: batchPassword }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功创建 ${data.data.created} 个账号`);
        setShowBatchForm(false);
        loadData();
      } else {
        alert(data.error || '创建失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams({ type: exportType });
    if (exportStatus !== 'all') params.set('status', exportStatus);
    if (exportStartDate) params.set('start_date', exportStartDate);
    if (exportEndDate) params.set('end_date', exportEndDate);

    try {
      const res = await fetch(`/api/export?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspection_export_${new Date().toISOString().split('T')[0]}.${exportType === 'csv' ? 'csv' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('导出失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>加载中...</div>
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
        <div className="title" style={{ flex: 1 }}>管理后台</div>
        <button onClick={() => router.push('/admin/archive')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '6px', padding: '4px 12px', fontSize: '13px', cursor: 'pointer' }}>
          归档管理
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <div className={`tab ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
          人员管理
        </div>
        <div className={`tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          实时记录
        </div>
        <div className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>
          数据导出
        </div>
      </div>

      {activeTab === 'personnel' && (
        <>
          {/* Role Stats */}
          <div className="section">
            <div className="section-title">👥 人员统计</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'admin').map(([role, label]) => (
                <div key={role} className="card" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: ROLE_COLORS[role] }}>{roleCounts[role] || 0}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Default Accounts (Admin Only) */}
          <div className="section">
            <div className="section-title">🔑 默认测试账号</div>
            <div className="card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>以下账号仅供测试，正式使用请修改密码或创建新账号</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                <div style={{ color: '#666' }}>管理员: admin</div>
                <div style={{ color: '#666' }}>密码: admin123</div>
                <div style={{ color: '#666' }}>辅助: assistant1</div>
                <div style={{ color: '#666' }}>密码: pass123</div>
                <div style={{ color: '#666' }}>线长: leader1</div>
                <div style={{ color: '#666' }}>密码: pass123</div>
                <div style={{ color: '#666' }}>主管: supervisor1</div>
                <div style={{ color: '#666' }}>密码: pass123</div>
                <div style={{ color: '#666' }}>QC: qc1</div>
                <div style={{ color: '#666' }}>密码: pass123</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ padding: '0 12px', display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '10px' }} onClick={() => setShowAddForm(true)}>
              + 添加用户
            </button>
            <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => setShowBatchForm(true)}>
              批量创建
            </button>
          </div>

          {/* User List */}
          <div className="section">
            <div className="section-title">📋 用户列表</div>
            {users.map((u) => (
              <div key={u.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{u.username}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="role-tag" style={{ background: ROLE_COLORS[u.role] }}>{ROLE_LABELS[u.role]}</span>
                    <button onClick={() => openEditModal(u)} style={{ background: 'none', border: '1px solid #1976d2', color: '#1976d2', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '4px' }}>
                      编辑
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: '1px solid #d32f2f', color: '#d32f2f', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '4px' }}>
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'records' && (
        <AdminRecords />
      )}

      {activeTab === 'export' && (
        <div className="section">
          <div className="section-title">📊 数据导出</div>
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>导出格式</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`btn-secondary ${exportType === 'csv' ? 'active' : ''}`} onClick={() => setExportType('csv')} style={{ flex: 1 }}>
                  CSV
                </button>
                <button className={`btn-secondary ${exportType === 'excel' ? 'active' : ''}`} onClick={() => setExportType('excel')} style={{ flex: 1 }}>
                  Excel
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>状态筛选</label>
              <select className="input-box" value={exportStatus} onChange={(e) => setExportStatus(e.target.value)}>
                <option value="all">全部状态</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
                <option value="line_leader_review">待线长审核</option>
                <option value="supervisor_review">待主管审核</option>
                <option value="qc_review">待QC审核</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>开始日期</label>
                <input className="input-box" type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>结束日期</label>
                <input className="input-box" type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleExport} style={{ width: '100%', padding: '12px' }}>
              📥 导出数据
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>添加用户</div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>用户名</label>
              <input className="input-box" type="text" placeholder="登录用户名" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>姓名</label>
              <input className="input-box" type="text" placeholder="真实姓名" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>密码</label>
              <input className="input-box" type="password" placeholder="登录密码" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>角色</label>
              <select className="input-box" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="assistant">辅助</option>
                <option value="line_leader">线长</option>
                <option value="supervisor">主管</option>
                <option value="qc">QC</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>取消</button>
              <button className="btn-primary" onClick={handleAddUser} style={{ flex: 1 }}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Create Modal */}
      {showBatchForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>批量创建账号</div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>角色</label>
              <select className="input-box" value={batchRole} onChange={(e) => setBatchRole(e.target.value)}>
                <option value="assistant">辅助</option>
                <option value="line_leader">线长</option>
                <option value="supervisor">主管</option>
                <option value="qc">QC</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>创建数量</label>
              <input className="input-box" type="number" min="1" max="100" value={batchCount} onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>统一密码</label>
              <input className="input-box" type="text" value={batchPassword} onChange={(e) => setBatchPassword(e.target.value)} />
            </div>
            <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              将创建 {batchCount} 个{ROLE_LABELS[batchRole]}账号，用户名自动生成（如 assistant1, assistant2...）
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowBatchForm(false)} style={{ flex: 1 }}>取消</button>
              <button className="btn-primary" onClick={handleBatchCreate} style={{ flex: 1 }}>确认创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="section-title">编辑用户</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>用户名</label>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="input" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>姓名</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>角色</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className="input">
                <option value="assistant">辅助</option>
                <option value="line_leader">线长</option>
                <option value="supervisor">主管</option>
                <option value="qc">QC</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>新密码（留空则不修改）</label>
              <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="input" placeholder="留空不修改密码" />
            </div>
            {editMsg && <div style={{ fontSize: '12px', color: editMsg.includes('成功') ? '#2e7d32' : '#d32f2f', marginBottom: '12px' }}>{editMsg}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>取消</button>
              <button className="btn-primary" onClick={handleEditUser} style={{ flex: 1 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 实时记录管理组件 ============
interface InspectionRecord {
  id: number;
  product_name: string;
  product_code: string;
  status: string;
  assistant_name: string;
  current_reviewer_name: string | null;
  result: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
}

function AdminRecords() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const STATUS_LABELS: Record<string, string> = {
    draft: '草稿',
    line_leader_review: '线长审核中',
    supervisor_review: '主管审核中',
    qc_review: 'QC审核中',
    approved: '已通过',
    rejected: '已驳回',
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: '#9e9e9e',
    line_leader_review: '#FF9800',
    supervisor_review: '#9C27B0',
    qc_review: '#2196F3',
    approved: '#4CAF50',
    rejected: '#F44336',
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/inspections');
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch (err) {
      console.error('获取记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/inspections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`记录 #${id} 已删除`);
        setRecords(prev => prev.filter(r => r.id !== id));
        selectedIds.delete(id);
        setSelectedIds(new Set(selectedIds));
      } else {
        setMessage(`删除失败: ${data.error}`);
      }
    } catch {
      setMessage('删除失败');
    }
    setDeleteConfirm(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch('/api/inspections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`已删除 ${data.data.deletedCount} 条记录`);
        setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
      } else {
        setMessage(`批量删除失败: ${data.error}`);
      }
    } catch {
      setMessage('批量删除失败');
    }
    setBatchDeleteConfirm(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const filteredRecords = statusFilter === 'all'
    ? records
    : records.filter(r => r.status === statusFilter);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="section">
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-title">📋 检验记录管理</div>

      {message && (
        <div style={{
          padding: '8px 12px', marginBottom: '12px', borderRadius: '6px',
          backgroundColor: message.includes('失败') ? '#ffebee' : '#e8f5e9',
          color: message.includes('失败') ? '#c62828' : '#2e7d32',
          fontSize: '13px',
        }}>
          {message}
        </div>
      )}

      {/* 筛选与操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>状态筛选:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input"
            style={{ padding: '4px 8px', fontSize: '13px', minWidth: '120px' }}
          >
            <option value="all">全部</option>
            <option value="draft">草稿</option>
            <option value="line_leader_review">线长审核中</option>
            <option value="supervisor_review">主管审核中</option>
            <option value="qc_review">QC审核中</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
        <span style={{ fontSize: '13px', color: '#999' }}>
          共 {filteredRecords.length} 条记录
        </span>
        {selectedIds.size > 0 && (
          <button
            className="btn-secondary"
            onClick={() => setBatchDeleteConfirm(true)}
            style={{ marginLeft: 'auto', fontSize: '13px', color: '#d32f2f', borderColor: '#d32f2f' }}
          >
            批量删除 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* 记录表格 */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', width: '36px' }}>
                <input
                  type="checkbox"
                  checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>产品名称</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>产品编号</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>状态</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>结果</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>创建人</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>当前审核人</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>创建时间</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>提交时间</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                  暂无记录
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>#{record.id}</td>
                  <td style={{ padding: '10px 12px' }}>{record.product_name}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px' }}>{record.product_code}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#fff',
                      backgroundColor: STATUS_COLORS[record.status] || '#999',
                    }}>
                      {STATUS_LABELS[record.status] || record.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      color: record.result === 'pass' ? '#2e7d32' : record.result === 'fail' ? '#c62828' : '#666',
                      fontWeight: 500,
                    }}>
                      {record.result === 'pass' ? '通过' : record.result === 'fail' ? '不通过' : '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{record.assistant_name || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{record.current_reviewer_name || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666' }}>{formatDate(record.created_at)}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666' }}>{formatDate(record.submitted_at)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => window.open(`/inspection/${record.id}`, '_blank')}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        查看
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setDeleteConfirm(record.id)}
                        style={{ padding: '2px 8px', fontSize: '12px', color: '#d32f2f', borderColor: '#d32f2f' }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 单条删除确认弹窗 */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ padding: '16px 20px', color: '#333' }}>
              确定要删除记录 <strong>#{deleteConfirm}</strong> 吗？<br />
              <span style={{ fontSize: '12px', color: '#999' }}>删除后数据无法恢复，关联照片也将被清理。</span>
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>取消</button>
              <button className="btn-primary" onClick={() => handleDelete(deleteConfirm)} style={{ backgroundColor: '#d32f2f' }}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {batchDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setBatchDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>批量删除确认</h3>
              <button className="modal-close" onClick={() => setBatchDeleteConfirm(false)}>×</button>
            </div>
            <p style={{ padding: '16px 20px', color: '#333' }}>
              确定要删除选中的 <strong>{selectedIds.size}</strong> 条记录吗？<br />
              <span style={{ fontSize: '12px', color: '#999' }}>删除后数据无法恢复，关联照片也将被清理。</span>
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setBatchDeleteConfirm(false)}>取消</button>
              <button className="btn-primary" onClick={handleBatchDelete} style={{ backgroundColor: '#d32f2f' }}>
                确认批量删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
