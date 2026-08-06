"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

const SIDE_NAMES = ["正面", "背面", "左侧", "右侧", "顶部", "底部"];

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadInspection();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    }
  };

  const loadInspection = async () => {
    try {
      const res = await fetch(`/api/inspections?id=${id}`);
      if (!res.ok) {
        alert("检验记录不存在");
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setInspection(data.data);
    } catch {
      alert("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const canApprove = () => {
    if (!user || !inspection) return false;
    if (user.role === "admin") return true;
    if (user.role === "line_leader" && inspection.status === "line_leader_review") return true;
    if (user.role === "supervisor" && inspection.status === "supervisor_review") return true;
    if (user.role === "qc" && inspection.status === "qc_review") return true;
    return false;
  };

  const handleApprove = async () => {
    if (!confirm("确认通过此检验？")) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/inspections/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "操作失败");
        return;
      }
      alert("审核通过");
      loadInspection();
    } catch {
      alert("网络错误");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("请填写驳回原因");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/inspections/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "操作失败");
        return;
      }
      alert("已驳回");
      setShowRejectDialog(false);
      setRejectReason("");
      loadInspection();
    } catch {
      alert("网络错误");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  if (!inspection) {
    return <div className="min-h-screen flex items-center justify-center">记录不存在</div>;
  }

  let comparisons = [];
  try {
    comparisons = JSON.parse(inspection.comparisons || "[]");
  } catch {
    comparisons = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              ← 返回
            </Button>
            <h1 className="text-lg font-bold">检验详情 #{inspection.id}</h1>
          </div>
          {canApprove() && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                驳回
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
                {processing ? "处理中..." : "通过"}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status & Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>产品信息</CardTitle>
              <Badge className={STATUS_COLORS[inspection.status]}>
                {STATUS_NAMES[inspection.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">产品名称</p>
                <p className="font-medium">{inspection.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">产品代码</p>
                <p className="font-medium">{inspection.product_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">色号</p>
                <p className="font-medium">{inspection.color_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">批号</p>
                <p className="font-medium">{inspection.batch_number || "-"}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">辅助人员</p>
                <p className="font-medium">{inspection.assistant_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="font-medium">{new Date(inspection.created_at).toLocaleString("zh-CN")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">首件判定</p>
                <Badge className={inspection.result === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {inspection.result === "pass" ? "通过" : "不通过"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Comparisons */}
        <Card>
          <CardHeader>
            <CardTitle>照片对比</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {comparisons.map((comp: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{SIDE_NAMES[comp.side - 1]}对比</h3>
                  <Badge className={comp.result === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {comp.result === "pass" ? "通过" : "不通过"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">标样照片</p>
                    <div className="border rounded-lg overflow-hidden h-48">
                      {comp.standard ? (
                        <img src={comp.standard} alt="标样" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          无照片
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">首件实物照片</p>
                    <div className="border rounded-lg overflow-hidden h-48">
                      {comp.actual ? (
                        <img src={comp.actual} alt="首件" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          无照片
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {comp.result === "fail" && comp.difference && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 font-medium mb-1">差异说明：</p>
                    <p className="text-sm text-red-700">{comp.difference}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Result Summary */}
        <Card>
          <CardHeader>
            <CardTitle>核对结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${inspection.result === "pass" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                {inspection.result === "pass" ? (
                  <>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-green-700">核对结果：通过</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-red-700">核对结果：不通过</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{inspection.result_summary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle>审核记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Created */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">辅助 {inspection.assistant_name} 提交检验</p>
                  <p className="text-xs text-gray-500">{new Date(inspection.created_at).toLocaleString("zh-CN")}</p>
                </div>
              </div>

              {/* Line Leader */}
              {inspection.line_leader_id && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${inspection.status === "line_leader_review" ? "bg-blue-500 animate-pulse" : inspection.line_leader_approved ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      线长 {inspection.line_leader_name}{" "}
                      {inspection.line_leader_approved ? "审核通过" : "审核驳回"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inspection.line_leader_time && new Date(inspection.line_leader_time).toLocaleString("zh-CN")}
                    </p>
                    {inspection.line_leader_reject_reason && (
                      <p className="text-xs text-red-600 mt-1">原因：{inspection.line_leader_reject_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Supervisor */}
              {inspection.supervisor_id && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${inspection.status === "supervisor_review" ? "bg-blue-500 animate-pulse" : inspection.supervisor_approved ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      主管 {inspection.supervisor_name}{" "}
                      {inspection.supervisor_approved ? "审核通过" : "审核驳回"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inspection.supervisor_time && new Date(inspection.supervisor_time).toLocaleString("zh-CN")}
                    </p>
                    {inspection.supervisor_reject_reason && (
                      <p className="text-xs text-red-600 mt-1">原因：{inspection.supervisor_reject_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* QC */}
              {inspection.qc_id && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${inspection.status === "qc_review" ? "bg-blue-500 animate-pulse" : inspection.qc_approved ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      QC {inspection.qc_name}{" "}
                      {inspection.qc_approved ? "审核通过" : "审核驳回"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inspection.qc_time && new Date(inspection.qc_time).toLocaleString("zh-CN")}
                    </p>
                    {inspection.qc_reject_reason && (
                      <p className="text-xs text-red-600 mt-1">原因：{inspection.qc_reject_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pending */}
              {inspection.status.includes("review") && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-2" />
                  <div>
                    <p className="text-sm text-gray-500">等待审核中...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>驳回检验</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>驳回原因 *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请填写驳回原因，将通知辅助人员"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  取消
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing}>
                  {processing ? "处理中..." : "确认驳回"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
