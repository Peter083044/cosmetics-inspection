"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

const ROLE_NAMES: Record<string, string> = {
  assistant: "辅助",
  line_leader: "线长",
  supervisor: "主管",
  qc: "QC",
  admin: "管理员",
};

const STATUS_NAMES: Record<string, string> = {
  pending: "待提交",
  line_leader_review: "线长审核中",
  supervisor_review: "主管审核中",
  qc_review: "QC审核中",
  approved: "已通过",
  rejected: "已驳回",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  line_leader_review: "bg-blue-100 text-blue-700",
  supervisor_review: "bg-purple-100 text-purple-700",
  qc_review: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setUser(data.user);
      loadInspections();
    } catch {
      router.push("/login");
    }
  };

  const loadInspections = async () => {
    try {
      const res = await fetch("/api/inspections");
      if (res.ok) {
        const data = await res.json();
        setInspections(data.data || []);
      }
    } catch (error) {
      console.error("Load inspections error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  const handleNewInspection = () => {
    router.push("/inspection/new");
  };

  const handleViewInspection = (id: number) => {
    router.push(`/inspection/${id}`);
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
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">首件核对系统</h1>
              <p className="text-xs text-gray-500">化妆品生产检验管理</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <Badge variant="outline" className="text-xs">
                {ROLE_NAMES[user.role]}
              </Badge>
            </div>
            {user.role === "admin" && (
              <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
                用户管理
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">待审核</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {inspections.filter((i) => i.status.includes("review")).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">已通过</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {inspections.filter((i) => i.status === "approved").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">已驳回</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {inspections.filter((i) => i.status === "rejected").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">总记录</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{inspections.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">检验记录</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                window.open(`/api/export?${params}`, "_blank");
              }}
            >
              导出记录
            </Button>
            {(user.role === "assistant" || user.role === "admin") && (
              <Button onClick={handleNewInspection}>新建检验</Button>
            )}
          </div>
        </div>

        {/* Inspection List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无检验记录</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品信息</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">辅助人员</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">#{inspection.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{inspection.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {inspection.product_code} | 色号: {inspection.color_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{inspection.assistant_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[inspection.status]}>
                        {STATUS_NAMES[inspection.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(inspection.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewInspection(inspection.id)}>
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
