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
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "assistant",
  });

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
          <Button onClick={() => setShowAddDialog(true)}>添加用户</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
            </CardHeader>
            <CardContent>
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
    </div>
  );
}
