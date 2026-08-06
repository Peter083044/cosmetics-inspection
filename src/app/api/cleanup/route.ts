import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

// DELETE: 清理已归档的记录和照片
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '未授权，仅管理员可操作' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json({ success: false, error: '需要确认参数 confirm=true' }, { status: 400 });
    }

    if (!startDate && !endDate) {
      return NextResponse.json({ success: false, error: '必须指定日期范围' }, { status: 400 });
    }

    let query = 'SELECT id, comparisons, label_comparisons FROM inspections WHERE 1=1';
    const params: string[] = [];

    if (startDate) {
      query += ' AND inspection_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND inspection_date <= ?';
      params.push(endDate);
    }

    const inspections = db.prepare(query).all(...params) as any[];

    if (inspections.length === 0) {
      return NextResponse.json({ success: false, error: '没有符合条件的记录' }, { status: 404 });
    }

    const inspectionIds = inspections.map((i: any) => i.id);
    const placeholders = inspectionIds.map(() => '?').join(',');

    // 收集照片路径
    const photoPaths = new Set<string>();
    for (const insp of inspections) {
      try {
        const comparisons = JSON.parse(insp.comparisons || '[]');
        for (const comp of comparisons) {
          if (comp.standard) photoPaths.add(comp.standard);
          if (comp.actual) photoPaths.add(comp.actual);
        }
        const labelComparisons = JSON.parse(insp.label_comparisons || '[]');
        for (const lc of labelComparisons) {
          if (lc.standard_label) photoPaths.add(lc.standard_label);
          if (lc.first_article_label) photoPaths.add(lc.first_article_label);
        }
      } catch { /* ignore */ }
    }

    // 删除照片文件
    let deletedPhotos = 0;
    let freedBytes = 0;
    for (const photoPath of photoPaths) {
      const filePath = path.join(process.cwd(), 'public', photoPath);
      try {
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          freedBytes += stat.size;
          fs.unlinkSync(filePath);
          deletedPhotos++;
        }
      } catch { /* skip */ }
    }

    // 删除审核日志
    db.prepare(`DELETE FROM approvals WHERE inspection_id IN (${placeholders})`).run(...inspectionIds);

    // 删除检验记录
    const result = db.prepare(`DELETE FROM inspections WHERE id IN (${placeholders})`).run();

    return NextResponse.json({
      success: true,
      data: {
        deleted_records: result.changes,
        deleted_photos: deletedPhotos,
        freed_bytes: freedBytes,
        freed_display: formatSize(freedBytes),
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ success: false, error: '清理失败' }, { status: 500 });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
