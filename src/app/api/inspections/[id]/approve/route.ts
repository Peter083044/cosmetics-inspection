import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, REVIEW_FLOW, REJECT_FLOW } from '@/lib/auth';
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

    const { action, comment, comments, submitReason, submit_explanation } = await request.json();
    // 兼容前端发送 comment 或 comments
    const remark = comment || comments || null;

    if (!action || !['approved', 'rejected', 'returned', 'submitted'].includes(action)) {
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

    // 处理"提交"操作（辅助人员从草稿提交到线长审核）
    if (action === 'submitted') {
      if (user.role !== 'assistant' && user.role !== 'admin') {
        return NextResponse.json(
          { error: '只有辅助角色可以提交检验记录' },
          { status: 403 }
        );
      }
      if (inspection.status !== 'draft' && inspection.status !== 'rejected') {
        return NextResponse.json(
          { error: '当前状态不允许提交' },
          { status: 400 }
        );
      }

      // 检查通过率
      const comparisons = JSON.parse(inspection.comparisons || '[]');
      const activeComparisons = comparisons.filter((c: any) => c.standard || c.actual);
      if (activeComparisons.length > 0) {
        const failCount = activeComparisons.filter((c: any) => c.result === 'fail').length;
        if (failCount > 0 && !submitReason && !submit_explanation) {
          return NextResponse.json(
            { error: '通过率不足100%时，必须填写提交说明原因' },
            { status: 400 }
          );
        }
      }

      // 记录审核日志
      const insertApproval = db.prepare(`
        INSERT INTO approvals (inspection_id, reviewer_id, reviewer_role, action, comments, submit_reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertApproval.run(
        inspectionId,
        user.id,
        user.role,
        'submitted',
        remark,
        submitReason || submit_explanation || null
      );

      // 更新状态到线长审核
      const explanation = submitReason || submit_explanation || null;
      db.prepare(`
        UPDATE inspections 
        SET status = 'line_leader_review', submit_explanation = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(explanation, inspectionId);

      return NextResponse.json({
        success: true,
        newStatus: 'line_leader_review',
      });
    }

    // 验证审核权限 - 管理员可以审核任何阶段
    if (user.role !== 'admin') {
      const expectedStatus = `${user.role}_review`;
      if (inspection.status !== expectedStatus) {
        return NextResponse.json(
          { error: `当前记录不在审核阶段（当前：${inspection.status}，期望：${expectedStatus}）` },
          { status: 400 }
        );
      }
    }

    // 记录审核日志
    const insertApproval = db.prepare(`
      INSERT INTO approvals (inspection_id, reviewer_id, reviewer_role, action, comments, submit_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertApproval.run(
      inspectionId,
      user.id,
      user.role,
      action,
      remark,
      submitReason || null
    );

    // 更新检验记录状态
    let newStatus: string;
    let rejectedTo: string | null = null;

    if (action === 'rejected') {
      // 驳回 - 直接变为已驳回状态
      newStatus = 'rejected';
    } else if (action === 'returned') {
      // 退回 - 返回上一级，让上一级重新编辑
      const rejectFlow = REJECT_FLOW[user.role as keyof typeof REJECT_FLOW];
      if (rejectFlow) {
        newStatus = rejectFlow.status;
        rejectedTo = rejectFlow.back_to;
      } else {
        return NextResponse.json(
          { error: '无法退回，当前已是第一级审核' },
          { status: 400 }
        );
      }
    } else {
      // 通过 - 进入下一阶段
      const flow = REVIEW_FLOW[user.role as keyof typeof REVIEW_FLOW];
      newStatus = flow?.status || 'approved';
    }

    db.prepare(`
      UPDATE inspections 
      SET status = ?, rejected_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, rejectedTo, inspectionId);

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
