import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, REVIEW_FLOW } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';
import fs from 'fs';
import path from 'path';

initDatabase();

// GET /api/inspections - 获取检验记录列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 获取单条检验记录详情
    if (id) {
      const inspection = db.prepare(`
        SELECT i.*, u.name as assistant_name
        FROM inspections i
        JOIN users u ON i.assistant_id = u.id
        WHERE i.id = ?
      `).get(id) as any;

      if (!inspection) {
        return NextResponse.json({ error: '检验记录不存在' }, { status: 404 });
      }

      // 解析 comparisons JSON
      if (inspection.comparisons && typeof inspection.comparisons === 'string') {
        try {
          inspection.comparisons = JSON.parse(inspection.comparisons);
        } catch {
          inspection.comparisons = [];
        }
      }

      // 解析 label_comparisons JSON
      if (inspection.label_comparisons && typeof inspection.label_comparisons === 'string') {
        try {
          inspection.label_comparisons = JSON.parse(inspection.label_comparisons);
        } catch {
          inspection.label_comparisons = [];
        }
      }

      // 解析 review_levels JSON
      if (inspection.review_levels && typeof inspection.review_levels === 'string') {
        try {
          inspection.review_levels = JSON.parse(inspection.review_levels);
        } catch {
          inspection.review_levels = ['line_leader', 'supervisor', 'qc'];
        }
      }

      return NextResponse.json({
        success: true,
        data: inspection,
      });
    }

    let query = `
      SELECT i.*, u.name as assistant_name
      FROM inspections i
      JOIN users u ON i.assistant_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 根据角色过滤可见记录
    if (user.role === 'assistant') {
      query += ' AND i.assistant_id = ?';
      params.push(user.id);
    } else if (user.role === 'line_leader') {
      query += ' AND i.status IN (?, ?)';
      params.push('line_leader_review', 'approved');
    } else if (user.role === 'supervisor') {
      query += ' AND i.status IN (?, ?)';
      params.push('supervisor_review', 'approved');
    } else if (user.role === 'qc') {
      query += ' AND i.status IN (?, ?)';
      params.push('qc_review', 'approved');
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const inspections = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    return NextResponse.json(
      { error: '获取检验记录失败' },
      { status: 500 }
    );
  }
}

// POST /api/inspections - 创建检验记录 或 批量删除（_action: 'delete'）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 检查是否是删除操作
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }

    if (body._action === 'delete') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: '仅管理员可删除记录' }, { status: 403 });
      }
      const { ids } = body as { ids: number[]; _action: string };
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: '请提供要删除的记录ID' }, { status: 400 });
      }

      const placeholders = ids.map(() => '?').join(',');

      // 获取要删除记录的照片路径
      const photos = db.prepare(`
        SELECT comparisons, label_comparisons FROM inspections WHERE id IN (${placeholders})
      `).all(...ids) as any[];

      const photoPaths = new Set<string>();
      for (const record of photos) {
        try {
          const comparisons = JSON.parse(record.comparisons || '[]');
          for (const c of comparisons) {
            if (c.standard_photo) photoPaths.add(c.standard_photo);
            if (c.actual_photo) photoPaths.add(c.actual_photo);
          }
          const labels = JSON.parse(record.label_comparisons || '[]');
          for (const l of labels) {
            if (l.standard_photo) photoPaths.add(l.standard_photo);
            if (l.actual_photo) photoPaths.add(l.actual_photo);
          }
        } catch { /* ignore */ }
      }

      // 删除记录
      const result = db.prepare(`DELETE FROM inspections WHERE id IN (${placeholders})`).run(...ids);

      // 删除审核日志
      db.prepare(`DELETE FROM approvals WHERE inspection_id IN (${placeholders})`).run(...ids);

      // 删除不再被引用的照片文件
      let deletedPhotos = 0;
      for (const photoPath of photoPaths) {
        const refCount = db.prepare(`
          SELECT COUNT(*) as cnt FROM inspections WHERE
          comparisons LIKE ? OR label_comparisons LIKE ?
        `).get(`%${photoPath}%`, `%${photoPath}%`) as any;

        if (refCount.cnt === 0) {
          const fullPath = path.join(process.cwd(), 'public', photoPath);
          try {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              deletedPhotos++;
            }
          } catch { /* ignore */ }
        }
      }

      return NextResponse.json({
        success: true,
        message: `已删除 ${result.changes} 条记录，${deletedPhotos} 张照片`,
      });
    }

    // 创建检验记录
    if (user.role !== 'assistant' && user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有辅助角色可以创建检验记录' },
        { status: 403 }
      );
    }

    const { inspection_date, product_name, product_code, color_number, batch_number, work_order_image, instruction_order_image, comparisons, result, result_summary, submit_explanation, label_comparisons, review_levels } = body as any;

    if (!product_name || !product_code) {
      return NextResponse.json(
        { error: '产品名称和代码不能为空' },
        { status: 400 }
      );
    }

    // 通过率不足100%时，必须填写提交说明（包含标签核对）
    const activeComparisons = comparisons ? comparisons.filter((c: any) => c.standard || c.actual) : [];
    const activeLabels = label_comparisons ? label_comparisons.filter((lc: any) => lc.standard || lc.actual) : [];
    const hasFail = activeComparisons.some((c: any) => c.result === 'fail') || activeLabels.some((lc: any) => lc.result === 'fail');
    if (hasFail && !submit_explanation?.trim() && !result_summary?.trim()) {
      return NextResponse.json(
        { error: '通过率不足100%，必须填写提交说明原因' },
        { status: 400 }
      );
    }

    const imageToSave = work_order_image || instruction_order_image || null;

    // 确定审核链路，初始状态为 draft（由辅助人员在详情页选择审核人后提交）
    const validLevels = ['line_leader', 'supervisor', 'qc'];
    const levels = Array.isArray(review_levels) && review_levels.length > 0
      ? review_levels.filter((l: string) => validLevels.includes(l))
      : ['line_leader', 'supervisor', 'qc'];

    // 创建检验记录（草稿状态，不自动分配审核人）
    const now = new Date().toISOString();
    const insertInspection = db.prepare(`
      INSERT INTO inspections (inspection_date, product_name, product_code, color_number, batch_number, work_order_image, comparisons, result, result_summary, submit_explanation, label_comparisons, review_levels, assistant_id, assistant_name, status, submitted_at, current_reviewer_id, current_reviewer_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const inspectionResult = insertInspection.run(
      inspection_date || new Date().toISOString().split('T')[0],
      product_name,
      product_code,
      color_number || null,
      batch_number || null,
      imageToSave,
      comparisons ? JSON.stringify(comparisons) : null,
      result || null,
      result_summary || null,
      submit_explanation || result_summary || null,
      label_comparisons ? JSON.stringify(label_comparisons) : null,
      JSON.stringify(levels),
      user.id,
      user.name || user.username,
      'draft',
      null,
      null,
      null
    );

    const inspectionId = inspectionResult.lastInsertRowid;

    return NextResponse.json({
      success: true,
      inspectionId,
    });
  } catch (error) {
    console.error('Create inspection error:', error);
    return NextResponse.json(
      { error: '创建检验记录失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/inspections - 管理员删除检验记录（单条或批量）
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '仅管理员可删除记录' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
    }
    const { ids } = body as { ids: number[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请提供要删除的记录ID' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(',');

    // 获取要删除记录的照片路径
    const photos = db.prepare(`
      SELECT comparisons, label_comparisons FROM inspections WHERE id IN (${placeholders})
    `).all(...ids) as any[];

    const photoPaths = new Set<string>();
    for (const record of photos) {
      try {
        const comparisons = JSON.parse(record.comparisons || '[]');
        for (const c of comparisons) {
          if (c.standard && c.standard.startsWith('/uploads/')) photoPaths.add(c.standard);
          if (c.actual && c.actual.startsWith('/uploads/')) photoPaths.add(c.actual);
        }
        const labelComparisons = JSON.parse(record.label_comparisons || '[]');
        for (const c of labelComparisons) {
          if (c.standard && c.standard.startsWith('/uploads/')) photoPaths.add(c.standard);
          if (c.actual && c.actual.startsWith('/uploads/')) photoPaths.add(c.actual);
        }
      } catch { /* ignore */ }
    }

    // 删除审核日志
    db.prepare(`DELETE FROM approvals WHERE inspection_id IN (${placeholders})`).run(...ids);

    // 删除检验记录
    const result = db.prepare(`DELETE FROM inspections WHERE id IN (${placeholders})`).run(...ids);

    // 删除照片文件（仅当没有其他记录引用时）
    let deletedPhotos = 0;
    for (const photoPath of photoPaths) {
      const fullPath = path.join(process.cwd(), 'public', photoPath);
      // 检查是否还有其他记录引用此照片
      const likePath = `%${photoPath}%`;
      const refCount = db.prepare(`
        SELECT COUNT(*) as cnt FROM inspections 
        WHERE comparisons LIKE ? OR label_comparisons LIKE ?
      `).get(likePath, likePath) as any;

      if (refCount.cnt === 0 && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        deletedPhotos++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `已删除 ${result.changes} 条记录，${deletedPhotos} 张照片`,
    });
  } catch (error) {
    console.error('Delete inspection error:', error);
    return NextResponse.json(
      { error: '删除检验记录失败' },
      { status: 500 }
    );
  }
}
