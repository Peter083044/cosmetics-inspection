import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const THRESHOLD_GB = 3; // 3GB 警告阈值

// GET: 获取磁盘和存储使用情况
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '未授权，仅管理员可操作' }, { status: 403 });
    }

    const projectPath = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

    // 1. 磁盘总体使用情况
    let diskTotal = 0;
    let diskUsed = 0;
    let diskAvailable = 0;
    try {
      const dfOutput = execSync('df -B1 /workspace | tail -1').toString().trim().split(/\s+/);
      diskTotal = parseInt(dfOutput[1]) || 0;
      diskUsed = parseInt(dfOutput[2]) || 0;
      diskAvailable = parseInt(dfOutput[3]) || 0;
    } catch { /* ignore */ }

    // 2. 项目空间使用
    let projectSize = 0;
    try {
      const duOutput = execSync(`du -sb ${projectPath} 2>/dev/null | cut -f1`).toString().trim();
      projectSize = parseInt(duOutput) || 0;
    } catch { /* ignore */ }

    // 3. 各目录大小
    const dirSizes: Record<string, number> = {};
    const dirsToCheck = ['node_modules', '.next', '.git', 'public/uploads', 'data', 'src'];
    for (const dir of dirsToCheck) {
      const dirPath = path.join(projectPath, dir);
      try {
        if (fs.existsSync(dirPath)) {
          const duOutput = execSync(`du -sb ${dirPath} 2>/dev/null | cut -f1`).toString().trim();
          dirSizes[dir] = parseInt(duOutput) || 0;
        }
      } catch { /* ignore */ }
    }

    // 4. 数据库统计
    const recordCount = (db.prepare('SELECT COUNT(*) as cnt FROM inspections').get() as any).cnt;
    const approvalCount = (db.prepare('SELECT COUNT(*) as cnt FROM approvals').get() as any).cnt;
    const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;

    // 5. 数据库文件大小
    let dbFileSize = 0;
    try {
      const dbPath = path.join(projectPath, 'data', 'inspection.db');
      if (fs.existsSync(dbPath)) {
        dbFileSize = fs.statSync(dbPath).size;
      }
    } catch { /* ignore */ }

    // 6. 上传文件统计
    let uploadFileCount = 0;
    let uploadTotalSize = 0;
    const uploadDir = path.join(projectPath, 'public', 'uploads');
    try {
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        uploadFileCount = files.length;
        for (const f of files) {
          try {
            uploadTotalSize += fs.statSync(path.join(uploadDir, f)).size;
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    // 7. 计算警告状态
    const projectUsageGB = projectSize / (1024 * 1024 * 1024);
    const isWarning = projectUsageGB >= THRESHOLD_GB;
    const warningPercent = Math.min(100, Math.round((projectUsageGB / THRESHOLD_GB) * 100));

    return NextResponse.json({
      success: true,
      data: {
        disk: {
          total: diskTotal,
          used: diskUsed,
          available: diskAvailable,
          total_display: formatSize(diskTotal),
          used_display: formatSize(diskUsed),
          available_display: formatSize(diskAvailable),
        },
        project: {
          size: projectSize,
          size_display: formatSize(projectSize),
          threshold_gb: THRESHOLD_GB,
          warning_percent: warningPercent,
          is_warning: isWarning,
        },
        dirs: Object.fromEntries(
          Object.entries(dirSizes).map(([k, v]) => [k, { size: v, display: formatSize(v) }])
        ),
        database: {
          file_size: dbFileSize,
          file_size_display: formatSize(dbFileSize),
          record_count: recordCount,
          approval_count: approvalCount,
          user_count: userCount,
        },
        uploads: {
          file_count: uploadFileCount,
          total_size: uploadTotalSize,
          total_size_display: formatSize(uploadTotalSize),
        },
      },
    });
  } catch (error) {
    console.error('Storage check error:', error);
    return NextResponse.json({ success: false, error: '存储检查失败' }, { status: 500 });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
