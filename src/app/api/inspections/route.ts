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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query = `
      SELECT i.*, p.name as product_name, p.code as product_code, 
             p.color_number, p.batch_number,
             u.name as assistant_name
      FROM inspections i
      JOIN products p ON i.product_id = p.id
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

    const { product_id, photos, result, comparison_details } = await request.json();

    if (!product_id) {
      return NextResponse.json(
        { error: '产品信息不能为空' },
        { status: 400 }
      );
    }

    // 创建检验记录
    const insertInspection = db.prepare(`
      INSERT INTO inspections (product_id, assistant_id, status, result, comparison_details)
      VALUES (?, ?, ?, ?, ?)
    `);

    const inspectionResult = insertInspection.run(
      product_id,
      user.id,
      'line_leader_review',
      result || null,
      comparison_details ? JSON.stringify(comparison_details) : null
    );

    const inspectionId = inspectionResult.lastInsertRowid;

    // 保存照片信息
    if (photos && Array.isArray(photos)) {
      const insertPhoto = db.prepare(`
        INSERT INTO photos (inspection_id, face_number, standard_photo, actual_photo, comparison_result, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const photo of photos) {
        insertPhoto.run(
          inspectionId,
          photo.face_number,
          photo.standard_photo,
          photo.actual_photo,
          photo.comparison_result || null,
          photo.notes || null
        );
      }
    }

    // 记录审核日志
    const insertApproval = db.prepare(`
      INSERT INTO approvals (inspection_id, reviewer_id, reviewer_role, action, comments)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertApproval.run(
      inspectionId,
      user.id,
      user.role,
      'approved',
      '辅助提交检验记录'
    );

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
