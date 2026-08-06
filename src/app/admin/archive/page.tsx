'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Download,
  Trash2,
  HardDrive,
  Database,
  Image,
  FileText,
  FolderOpen,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface StorageInfo {
  disk: {
    total: number;
    used: number;
    available: number;
    total_display: string;
    used_display: string;
    available_display: string;
  };
  project: {
    size: number;
    size_display: string;
    threshold_gb: number;
    warning_percent: number;
    is_warning: boolean;
  };
  dirs: Record<string, { size: number; display: string }>;
  database: {
    file_size: number;
    file_size_display: string;
    record_count: number;
    approval_count: number;
    user_count: number;
  };
  uploads: {
    file_count: number;
    total_size: number;
    total_size_display: string;
  };
}

interface ArchivePreview {
  record_count: number;
  photo_count: number;
  photo_size: number;
  photo_size_display: string;
  date_range: { start: string | null; end: string | null };
}

export default function ArchiveManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preview, setPreview] = useState<ArchivePreview | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (!data.success) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      if (data.user.role !== 'admin') {
        router.push('/dashboard');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchStorageInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/storage');
      const data = await res.json();
      if (data.success) {
        setStorageInfo(data.data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchStorageInfo();
  }, [fetchUser, fetchStorageInfo]);

  const handlePreview = async () => {
    if (!startDate && !endDate) {
      setMessage({ type: 'error', text: '请至少选择一个日期' });
      return;
    }

    setIsLoadingPreview(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/archive?${params}`);
      const data = await res.json();
      if (data.success) {
        setPreview(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || '预览失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '预览请求失败' });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setMessage({ type: 'error', text: errData.error || '导出失败' });
        return;
      }

      // 下载 ZIP
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, '') || 'archive.zip')
        : 'archive.zip';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `归档导出成功：${filename}` });
    } catch {
      setMessage({ type: 'error', text: '导出请求失败' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanup = async () => {
    setShowCleanConfirm(false);
    setIsCleaning(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      params.set('confirm', 'true');

      const res = await fetch(`/api/cleanup?${params}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `清理完成：删除 ${data.data.deleted_records} 条记录、${data.data.deleted_photos} 张照片，释放 ${data.data.freed_display}`,
        });
        setPreview(null);
        fetchStorageInfo();
      } else {
        setMessage({ type: 'error', text: data.error || '清理失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '清理请求失败' });
    } finally {
      setIsCleaning(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
              &larr; 返回管理
            </Button>
            <h1 className="text-lg font-semibold">归档与存储管理</h1>
          </div>
          <Badge variant="outline">管理员</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 磁盘警告 */}
        {storageInfo?.project.is_warning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>存储空间警告</AlertTitle>
            <AlertDescription>
              项目空间已使用 {storageInfo.project.size_display}，超过 {storageInfo.project.threshold_gb}GB 阈值。
              建议尽快归档并清理旧记录。
            </AlertDescription>
          </Alert>
        )}

        {/* 消息提示 */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* 存储概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                项目空间
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageInfo?.project.size_display || '--'}</div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>使用率</span>
                  <span>{storageInfo?.project.warning_percent || 0}% / 100%</span>
                </div>
                <Progress
                  value={storageInfo?.project.warning_percent || 0}
                  className={`h-2 ${
                    (storageInfo?.project.warning_percent || 0) >= 80
                      ? '[&>div]:bg-red-500'
                      : (storageInfo?.project.warning_percent || 0) >= 60
                        ? '[&>div]:bg-yellow-500'
                        : ''
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  阈值：{storageInfo?.project.threshold_gb || 3}GB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageInfo?.database.record_count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                检验记录 {storageInfo?.database.record_count || 0} 条
              </p>
              <p className="text-xs text-muted-foreground">
                审核日志 {storageInfo?.database.approval_count || 0} 条
              </p>
              <p className="text-xs text-muted-foreground">
                数据库文件 {storageInfo?.database.file_size_display || '--'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Image className="h-4 w-4" />
                照片存储
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageInfo?.uploads.total_size_display || '--'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {storageInfo?.uploads.file_count || 0} 个文件
              </p>
              <p className="text-xs text-muted-foreground">
                磁盘可用：{storageInfo?.disk.available_display || '--'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 空间占用明细 */}
        {storageInfo?.dirs && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                空间占用明细
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(storageInfo.dirs)
                  .sort(([, a], [, b]) => b.size - a.size)
                  .map(([dir, info]) => (
                    <div key={dir} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-muted-foreground">{dir}/</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (info.size / storageInfo.project.size) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">{info.display}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 归档操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              归档导出与清理
            </CardTitle>
            <CardDescription>选择日期范围，将检验记录和照片打包导出，确认后可清理释放空间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期选择 */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-sm font-medium">开始日期</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreview(null);
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">结束日期</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreview(null);
                  }}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handlePreview}
                disabled={isLoadingPreview || (!startDate && !endDate)}
                variant="outline"
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    查询中...
                  </>
                ) : (
                  '预览归档内容'
                )}
              </Button>
            </div>

            {/* 预览结果 */}
            {preview && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <h3 className="font-medium text-sm">归档内容预览</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{preview.record_count}</div>
                    <div className="text-xs text-muted-foreground">检验记录</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{preview.photo_count}</div>
                    <div className="text-xs text-muted-foreground">照片文件</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{preview.photo_size_display}</div>
                    <div className="text-xs text-muted-foreground">照片大小</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {preview.date_range.start || '起始'} ~ {preview.date_range.end || '至今'}
                    </div>
                    <div className="text-xs text-muted-foreground">日期范围</div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleExport} disabled={isExporting} className="flex-1">
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        打包中...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        导出 ZIP 归档
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowCleanConfirm(true)}
                    disabled={isCleaning}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        清理中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        清理已归档记录
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 清理确认弹窗 */}
      <Dialog open={showCleanConfirm} onOpenChange={setShowCleanConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认清理
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除 {preview?.record_count || 0} 条检验记录和 {preview?.photo_count || 0} 张照片，
              释放约 {preview?.photo_size_display || '0'} 空间。
              <br />
              <br />
              <strong className="text-destructive">此操作不可撤销！</strong>
              请确保已完成归档导出。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleCleanup}>
              确认清理
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
