import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, REVIEW_FLOW } from '@/lib/auth';
import db, { initDatabase } from '@/lib/db';

initDatabase();

// POST /api/inspections/[id]/approve - 审核检验记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const inspectionId = parseInt(id);

    if (isNaN(inspectionId)) {
      return NextResponse.json(
        { error: '无效的检验记录ID' },
        { status: 400 }
      );
    }

    const { action, comments } = await request.json();

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: '操作类型无效' },
        { status: 400 }
      );
    }

    // 获取检验记录
    const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspectionId) as any;
    if (!inspection) {
      return NextResponse.json(
        { error: '检验记录不存在' },
        { status: 404 }
      );
    }

    // 验证审核权限
    const expectedStatus = `${user.role}_review`;
    if (inspection.status !== expectedStatus) {
      return NextResponse.json(
        { error: `当前记录不在${user.role}审核阶段` },
        { status: 400 }
      );
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
      action,
      comments || null
    );

    // 更新检验记录状态
    let newStatus: string;
    if (action === 'rejected') {
      newStatus = 'rejected';
    } else {
      // 根据当前角色确定下一个状态
      const flow = REVIEW_FLOW[user.role as keyof typeof REVIEW_FLOW];
      newStatus = flow?.status || 'approved';
    }

    const updateInspection = db.prepare(`
      UPDATE inspections 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateInspection.run(newStatus, inspectionId);

    return NextResponse.json({
      success: true,
      newStatus,
    });
  } catch (error) {
    console.error('Approve inspection error:', error);
    return NextResponse.json(
      { error: '审核操作失败' },
      { status: 500 }
    );
  }
}
