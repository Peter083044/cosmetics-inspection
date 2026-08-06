import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, REVIEW_FLOW } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

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

// POST /api/inspections - 创建检验记录
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (user.role !== 'assistant' && user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有辅助角色可以创建检验记录' },
        { status: 403 }
      );
    }

    const { inspection_date, product_name, product_code, color_number, batch_number, work_order_image, instruction_order_image, comparisons, result, result_summary, submit_explanation, label_standard, label_actual, label_result, label_difference } = await request.json();

    if (!product_name || !product_code) {
      return NextResponse.json(
        { error: '产品名称和代码不能为空' },
        { status: 400 }
      );
    }

    // 通过率不足100%时，必须填写提交说明（包含标签核对）
    const activeComparisons = comparisons ? comparisons.filter((c: any) => c.standard || c.actual) : [];
    const hasLabel = label_standard || label_actual;
    const hasFail = activeComparisons.some((c: any) => c.result === 'fail') || (label_result === 'fail' && hasLabel);
    if (hasFail && !submit_explanation?.trim() && !result_summary?.trim()) {
      return NextResponse.json(
        { error: '通过率不足100%，必须填写提交说明原因' },
        { status: 400 }
      );
    }

    const imageToSave = work_order_image || instruction_order_image || null;

    // 创建检验记录
    const insertInspection = db.prepare(`
      INSERT INTO inspections (inspection_date, product_name, product_code, color_number, batch_number, work_order_image, comparisons, result, result_summary, submit_explanation, label_standard, label_actual, label_result, label_difference, assistant_id, assistant_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      label_standard || null,
      label_actual || null,
      hasLabel ? (label_result || 'pass') : null,
      label_result === 'fail' ? (label_difference || null) : null,
      user.id,
      user.name || user.username,
      'line_leader_review'
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
