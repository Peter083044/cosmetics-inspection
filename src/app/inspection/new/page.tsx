"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface PhotoComparison {
  side: number;
  standard: string | null;
  actual: string | null;
  result: "pass" | "fail" | null;
  difference: string;
}

const SIDE_NAMES = ["正面", "背面", "左侧", "右侧", "顶部", "底部"];

export default function NewInspectionPage() {
  const router = useRouter();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Product info
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [colorNumber, setColorNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  // Photo comparisons (up to 6 sides)
  const [comparisons, setComparisons] = useState<PhotoComparison[]>(
    Array.from({ length: 6 }, (_, i) => ({
      side: i + 1,
      standard: null,
      actual: null,
      result: null,
      difference: "",
    }))
  );

  // Result
  const [overallResult, setOverallResult] = useState<"pass" | "fail" | null>(null);
  const [resultSummary, setResultSummary] = useState("");

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
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  const handlePhotoUpload = async (
    comparisonIndex: number,
    type: "standard" | "actual",
    file: File
  ) => {
    try {
      const url = await uploadFile(file);
      setComparisons((prev) => {
        const updated = [...prev];
        updated[comparisonIndex] = { ...updated[comparisonIndex], [type]: url };
        return updated;
      });
    } catch (error) {
      alert("上传失败，请重试");
    }
  };

  const handleResultChange = (index: number, result: "pass" | "fail") => {
    setComparisons((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], result };
      return updated;
    });
  };

  const handleDifferenceChange = (index: number, difference: string) => {
    setComparisons((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], difference };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!productName || !productCode || !colorNumber) {
      alert("请填写完整的产品信息");
      return;
    }

    const filledComparisons = comparisons.filter((c) => c.standard || c.actual);
    if (filledComparisons.length === 0) {
      alert("请至少上传一组对比照片");
      return;
    }

    // Check all filled comparisons have results
    const incomplete = filledComparisons.filter((c) => !c.result);
    if (incomplete.length > 0) {
      alert("请为每组对比照片选择判定结果");
      return;
    }

    // Check all failed comparisons have difference descriptions
    const failedWithoutDesc = filledComparisons.filter(
      (c) => c.result === "fail" && !c.difference.trim()
    );
    if (failedWithoutDesc.length > 0) {
      alert("请填写不合格项的差异说明");
      return;
    }

    // Calculate overall result
    const hasFail = filledComparisons.some((c) => c.result === "fail");
    const result = hasFail ? "fail" : "pass";

    // Generate summary
    const failItems = filledComparisons.filter((c) => c.result === "fail");
    let summary = "";
    if (result === "pass") {
      summary = "首件核对通过，所有对比面均符合标样要求。";
    } else {
      summary = "首件核对不通过，存在以下差异：\n";
      failItems.forEach((item) => {
        summary += `- ${SIDE_NAMES[item.side - 1]}：${item.difference}\n`;
      });
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          product_code: productCode,
          color_number: colorNumber,
          batch_number: batchNumber,
          comparisons: filledComparisons,
          result,
          result_summary: summary,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "提交失败");
        return;
      }

      alert("提交成功！已提交至线长审核");
      router.push("/dashboard");
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  if (!user || (user.role !== "assistant" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>无权限访问此页面</p>
      </div>
    );
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
            <h1 className="text-lg font-bold">新建首件核对</h1>
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "提交审核"}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">步骤1</Badge>
              录入产品信息
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">产品名称 *</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="如：柔雾唇膏"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCode">产品代码 *</Label>
              <Input
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="如：LP-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorNumber">色号 *</Label>
              <Input
                id="colorNumber"
                value={colorNumber}
                onChange={(e) => setColorNumber(e.target.value)}
                placeholder="如：C03-玫瑰红"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">批号（选填）</Label>
              <Input
                id="batchNumber"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="批号不参与比对"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Photo Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">步骤2</Badge>
              拍照对比（标样 vs 首件）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {comparisons.map((comp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{SIDE_NAMES[index]}对比</h3>
                  {comp.result && (
                    <Badge className={comp.result === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {comp.result === "pass" ? "通过" : "不通过"}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Standard Photo */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">标样照片</Label>
                    <div
                      className="border-2 border-dashed rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
                      onClick={() => fileInputRefs.current[index * 2]?.click()}
                    >
                      {comp.standard ? (
                        <img src={comp.standard} alt="标样" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs">点击上传标样</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={(el) => { fileInputRefs.current[index * 2] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePhotoUpload(index, "standard", e.target.files[0]);
                      }}
                    />
                  </div>

                  {/* Actual Photo */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">首件实物照片</Label>
                    <div
                      className="border-2 border-dashed rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
                      onClick={() => fileInputRefs.current[index * 2 + 1]?.click()}
                    >
                      {comp.actual ? (
                        <img src={comp.actual} alt="首件" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs">点击上传首件</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={(el) => { fileInputRefs.current[index * 2 + 1] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePhotoUpload(index, "actual", e.target.files[0]);
                      }}
                    />
                  </div>
                </div>

                {/* Result Selection */}
                {(comp.standard || comp.actual) && (
                  <div className="space-y-2">
                    <Label>判定结果</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={comp.result === "pass" ? "default" : "outline"}
                        size="sm"
                        className={comp.result === "pass" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => handleResultChange(index, "pass")}
                      >
                        通过
                      </Button>
                      <Button
                        variant={comp.result === "fail" ? "default" : "outline"}
                        size="sm"
                        className={comp.result === "fail" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => handleResultChange(index, "fail")}
                      >
                        不通过
                      </Button>
                    </div>
                  </div>
                )}

                {/* Difference Description */}
                {comp.result === "fail" && (
                  <div className="space-y-2">
                    <Label>差异说明 *</Label>
                    <Textarea
                      value={comp.difference}
                      onChange={(e) => handleDifferenceChange(index, e.target.value)}
                      placeholder="请描述与标样的差异，如：颜色偏浅、印刷位置偏移等"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step 3: Result Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">步骤3</Badge>
              核对结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparisons.some((c) => c.result) ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${comparisons.some((c) => c.result === "fail") ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {comparisons.some((c) => c.result === "fail") ? (
                      <>
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-red-700">核对结果：不通过</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-green-700">核对结果：通过</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {comparisons.some((c) => c.result === "fail")
                      ? "存在以下差异：\n" +
                        comparisons
                          .filter((c) => c.result === "fail")
                          .map((c) => `- ${SIDE_NAMES[c.side - 1]}：${c.difference}`)
                          .join("\n")
                      : "所有对比面均符合标样要求，批号信息已排除比对。"}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  提交后将依次经过：辅助 → 线长审核 → 主管审核 → QC审核
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">请先完成照片对比</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
