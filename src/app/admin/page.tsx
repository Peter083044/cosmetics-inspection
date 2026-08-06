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
  const [activeTab, setActiveTab] = useState<'personnel' | 'export'>('personnel');
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
