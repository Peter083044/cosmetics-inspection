import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import { ZipArchive } from 'archiver';
import { Readable } from 'stream';

const SIDE_NAMES = ['正面', '背面', '左侧面', '右侧面', '顶面', '底面'];

// GET: 预览归档内容（不下载，返回统计信息）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '未授权，仅管理员可操作' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = 'SELECT * FROM inspections WHERE 1=1';
    const params: string[] = [];

    if (startDate) {
      query += ' AND inspection_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND inspection_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY inspection_date DESC, id DESC';

    const inspections = db.prepare(query).all(...params) as any[];

    // 统计照片数量和大小
    let totalPhotos = 0;
    let totalPhotoSize = 0;
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
      } catch { /* ignore parse errors */ }
    }

    for (const p of photoPaths) {
      const filePath = path.join(process.cwd(), 'public', p);
      try {
        const stat = fs.statSync(filePath);
        totalPhotoSize += stat.size;
        totalPhotos++;
      } catch { /* file not found */ }
    }

    return NextResponse.json({
      success: true,
      data: {
        record_count: inspections.length,
        photo_count: totalPhotos,
        photo_size: totalPhotoSize,
        photo_size_display: formatSize(totalPhotoSize),
        date_range: { start: startDate, end: endDate },
      },
    });
  } catch (error) {
    console.error('Archive preview error:', error);
    return NextResponse.json({ success: false, error: '归档预览失败' }, { status: 500 });
  }
}

// POST: 下载归档 ZIP
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '未授权，仅管理员可操作' }, { status: 403 });
    }

    const body = await request.json();
    const { start_date, end_date } = body;

    let query = 'SELECT * FROM inspections WHERE 1=1';
    const params: string[] = [];

    if (start_date) {
      query += ' AND inspection_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND inspection_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY inspection_date DESC, id DESC';

    const inspections = db.prepare(query).all(...params) as any[];

    if (inspections.length === 0) {
      return NextResponse.json({ success: false, error: '没有符合条件的记录' }, { status: 404 });
    }

    // 获取审核日志
    const inspectionIds = inspections.map((i: any) => i.id);
    const placeholders = inspectionIds.map(() => '?').join(',');
    const approvals = db.prepare(
      `SELECT * FROM approvals WHERE inspection_id IN (${placeholders}) ORDER BY created_at DESC`
    ).all(...inspectionIds) as any[];

    // 创建 ZIP 到临时文件
    const tmpFile = path.join('/tmp', `archive_${Date.now()}.zip`);
    const output = fs.createWriteStream(tmpFile);
    const archive = new ZipArchive({ zlib: { level: 6 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));
      archive.pipe(output);

      // 1. 添加汇总 CSV
      const summaryRows = [
        ['检验编号', '检验日期', '产品名称', '产品代码', '色号', '状态', '检验员', '当前审核人', '通过率', '提交说明', '创建时间'],
      ];
      for (const insp of inspections) {
        summaryRows.push([
          `INS-${String(insp.id).padStart(6, '0')}`,
          insp.inspection_date || '',
          insp.product_name || '',
          insp.product_code || '',
          insp.color_number || '',
          translateStatus(insp.status),
          insp.inspector_name || '',
          insp.current_reviewer_name || '',
          `${insp.pass_rate ?? 100}%`,
          insp.submit_explanation || '',
          insp.created_at || '',
        ]);
      }
      const summaryCsv = '\uFEFF' + summaryRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      archive.append(Buffer.from(summaryCsv, 'utf-8'), { name: '汇总.csv' });

      // 2. 每条记录的详细 JSON + 收集照片路径
      const photoPaths = new Set<string>();

      for (const insp of inspections) {
        const folderName = `INS-${String(insp.id).padStart(6, '0')}_${insp.product_name || '未命名'}`;

        const detail = {
          id: insp.id,
          inspection_date: insp.inspection_date,
          product_name: insp.product_name,
          product_code: insp.product_code,
          color_number: insp.color_number,
          status: translateStatus(insp.status),
          inspector_name: insp.inspector_name,
          current_reviewer_name: insp.current_reviewer_name,
          pass_rate: insp.pass_rate,
          result: insp.result,
          result_summary: insp.result_summary,
          submit_explanation: insp.submit_explanation,
          created_at: insp.created_at,
          submitted_at: insp.submitted_at,
          comparisons: JSON.parse(insp.comparisons || '[]'),
          label_comparisons: JSON.parse(insp.label_comparisons || '[]'),
          approvals: approvals.filter((a: any) => a.inspection_id === insp.id).map((a: any) => ({
            action: a.action === 'approved' ? '通过' : a.action === 'rejected' ? '驳回' : '退回',
            reviewer_role: a.reviewer_role,
            reviewer_name: a.reviewer_name,
            comment: a.comment,
            created_at: a.created_at,
          })),
        };

        const detailJson = JSON.stringify(detail, null, 2);
        archive.append(Buffer.from(detailJson, 'utf-8'), { name: `${folderName}/详情.json` });

        // 收集照片路径
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

      // 3. 添加照片文件
      for (const photoPath of photoPaths) {
        const filePath = path.join(process.cwd(), 'public', photoPath);
        try {
          if (fs.existsSync(filePath)) {
            const fileName = path.basename(photoPath);
            archive.file(filePath, { name: `照片/${fileName}` });
          }
        } catch { /* skip missing files */ }
      }

      // 4. 添加审核日志 CSV
      if (approvals.length > 0) {
        const approvalRows = [
          ['检验ID', '操作', '审核角色', '审核人', '备注', '时间'],
        ];
        for (const a of approvals) {
          approvalRows.push([
            `INS-${String(a.inspection_id).padStart(6, '0')}`,
            a.action === 'approved' ? '通过' : a.action === 'rejected' ? '驳回' : a.action === 'returned' ? '退回' : a.action,
            a.reviewer_role || '',
            a.reviewer_name || '',
            a.comment || '',
            a.created_at || '',
          ]);
        }
        const approvalCsv = '\uFEFF' + approvalRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        archive.append(Buffer.from(approvalCsv, 'utf-8'), { name: '审核日志.csv' });
      }

      // 完成归档
      archive.finalize();
    });

    // 读取临时文件并返回
    const fileBuffer = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile); // 清理临时文件

    const dateStr = [start_date, end_date].filter(Boolean).join('_') || '全部';
    const filename = `检验归档_${dateStr}_${new Date().toISOString().slice(0, 10)}.zip`;

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Archive export error:', error);
    return NextResponse.json({ success: false, error: '归档导出失败' }, { status: 500 });
  }
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    line_leader_review: '线长审核中',
    supervisor_review: '主管审核中',
    qc_review: 'QC审核中',
    approved: '已通过',
    rejected: '已驳回',
  };
  return map[status] || status;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
