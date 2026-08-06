"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
}

const ROLE_NAMES: Record<string, string> = {
  assistant: "辅助",
  line_leader: "线长",
  supervisor: "主管",
  qc: "QC",
  admin: "管理员",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "assistant",
  });
  const [batchConfig, setBatchConfig] = useState({
    assistant_count: 40,
    line_leader_count: 30,
    supervisor_count: 5,
    qc_count: 15,
    password: "pass123",
  });
  const [batchProgress, setBatchProgress] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.user.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setUser(data.user);
      loadUsers();
    } catch {
      router.push("/login");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Load users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      alert("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "添加失败");
        return;
      }

      alert("用户添加成功");
      setShowAddDialog(false);
      setNewUser({ username: "", password: "", name: "", role: "assistant" });
      loadUsers();
    } catch {
      alert("网络错误");
    }
  };

  const handleBatchCreate = async () => {
    setBatchProgress("正在批量创建账号...");
    try {
      const res = await fetch("/api/users/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchConfig),
      });

      if (!res.ok) {
        const data = await res.json();
        setBatchProgress("");
        alert(data.error || "批量创建失败");
        return;
      }

      const data = await res.json();
      setBatchProgress("");
      setShowBatchDialog(false);
      alert(`批量创建成功！\n${data.message}`);
      loadUsers();
    } catch {
      setBatchProgress("");
      alert("网络错误");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("确认删除此用户？")) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除失败");
        return;
      }
      alert("用户已删除");
      loadUsers();
    } catch {
      alert("网络错误");
    }
  };

  // 统计各角色人数
  const roleCounts = {
    assistant: users.filter((u) => u.role === "assistant").length,
    line_leader: users.filter((u) => u.role === "line_leader").length,
    supervisor: users.filter((u) => u.role === "supervisor").length,
    qc: users.filter((u) => u.role === "qc").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              ← 返回
            </Button>
            <h1 className="text-lg font-bold">用户管理</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBatchDialog(true)}>
              批量创建账号
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>添加单个用户</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 角色统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{roleCounts.assistant}</div>
                <div className="text-sm text-blue-600">辅助</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{roleCounts.line_leader}</div>
                <div className="text-sm text-green-600">线长</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{roleCounts.supervisor}</div>
                <div className="text-sm text-purple-600">主管</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{roleCounts.qc}</div>
                <div className="text-sm text-orange-600">QC</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{roleCounts.admin}</div>
                <div className="text-sm text-red-600">管理员</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{u.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{u.username}</td>
                        <td className="px-4 py-3 text-sm">{u.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{ROLE_NAMES[u.role]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          {u.username !== "admin" && (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(u.id)}>
                              删除
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>添加用户</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="请输入密码"
                />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant">辅助</SelectItem>
                    <SelectItem value="line_leader">线长</SelectItem>
                    <SelectItem value="supervisor">主管</SelectItem>
                    <SelectItem value="qc">QC</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAddUser}>添加</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Create Dialog */}
      {showBatchDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>批量创建账号</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  将根据以下配置批量创建账号。用户名格式为：角色前缀+序号（如 assistant1, assistant2...）
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>辅助人员数量</Label>
                  <Input
                    type="number"
                    min="0"
                    value={batchConfig.assistant_count}
                    onChange={(e) => setBatchConfig({ ...batchConfig, assistant_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">当前: {roleCounts.assistant} 人</p>
                </div>
                <div className="space-y-2">
                  <Label>线长数量</Label>
                  <Input
                    type="number"
                    min="0"
                    value={batchConfig.line_leader_count}
                    onChange={(e) => setBatchConfig({ ...batchConfig, line_leader_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">当前: {roleCounts.line_leader} 人</p>
                </div>
                <div className="space-y-2">
                  <Label>主管数量</Label>
                  <Input
                    type="number"
                    min="0"
                    value={batchConfig.supervisor_count}
                    onChange={(e) => setBatchConfig({ ...batchConfig, supervisor_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">当前: {roleCounts.supervisor} 人</p>
                </div>
                <div className="space-y-2">
                  <Label>QC数量</Label>
                  <Input
                    type="number"
                    min="0"
                    value={batchConfig.qc_count}
                    onChange={(e) => setBatchConfig({ ...batchConfig, qc_count: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">当前: {roleCounts.qc} 人</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>统一密码</Label>
                <Input
                  value={batchConfig.password}
                  onChange={(e) => setBatchConfig({ ...batchConfig, password: e.target.value })}
                  placeholder="所有新账号的默认密码"
                />
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-sm font-medium mb-2">将创建以下账号：</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {batchConfig.assistant_count > 0 && (
                    <li>• 辅助人员 {batchConfig.assistant_count} 人 (assistant{roleCounts.assistant + 1} ~ assistant{roleCounts.assistant + batchConfig.assistant_count})</li>
                  )}
                  {batchConfig.line_leader_count > 0 && (
                    <li>• 线长 {batchConfig.line_leader_count} 人 (leader{roleCounts.line_leader + 1} ~ leader{roleCounts.line_leader + batchConfig.line_leader_count})</li>
                  )}
                  {batchConfig.supervisor_count > 0 && (
                    <li>• 主管 {batchConfig.supervisor_count} 人 (supervisor{roleCounts.supervisor + 1} ~ supervisor{roleCounts.supervisor + batchConfig.supervisor_count})</li>
                  )}
                  {batchConfig.qc_count > 0 && (
                    <li>• QC {batchConfig.qc_count} 人 (qc{roleCounts.qc + 1} ~ qc{roleCounts.qc + batchConfig.qc_count})</li>
                  )}
                </ul>
                <p className="text-sm text-gray-500 mt-2">
                  总计: {batchConfig.assistant_count + batchConfig.line_leader_count + batchConfig.supervisor_count + batchConfig.qc_count} 人
                </p>
              </div>

              {batchProgress && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">{batchProgress}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBatchDialog(false)} disabled={!!batchProgress}>
                  取消
                </Button>
                <Button onClick={handleBatchCreate} disabled={!!batchProgress}>
                  确认创建
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
